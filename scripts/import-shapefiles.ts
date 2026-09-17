/**
 * Import county parcel shapefiles into Supabase Postgres + PostGIS.
 *
 *   npx tsx scripts/import-shapefiles.ts \
 *     --file ./data/bonner_parcels.shp \
 *     --county Bonner
 *
 * Sources (free public GIS):
 *   Bonner County:   https://www.bonnercountyid.gov/departments/gis
 *   Boundary County: https://www.boundarycountyid.org/departments/gis (or Idaho INSIDE Idaho)
 *
 * Notes
 *  - This script does NOT compute slope / forest cover from rasters; instead it
 *    accepts CSV-side enrichments (or leaves them null and lets a follow-up
 *    enrichment job fill them).
 *  - Owner names are written only when present in the shapefile attributes
 *    AND deemed publishable by the source. The MVP does not enable outreach.
 *
 * Requires:  npm i -D shapefile @types/geojson tsx
 *            env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { open } from "shapefile";
import type { Polygon, MultiPolygon, Feature } from "geojson";
import { computeScores } from "../lib/scoring";
import { deterministicSummary } from "../lib/ai-summary";
import { getSupabaseAdmin } from "../lib/supabase";
import type { County, Parcel, ParcelEnrichment } from "../lib/types";

interface CliArgs {
  file: string;
  county: County;
  limit?: number;
}

function parseArgs(): CliArgs {
  const args: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const k = process.argv[i].replace(/^--/, "");
    args[k] = process.argv[i + 1];
  }
  if (!args.file || !args.county) {
    console.error("usage: tsx scripts/import-shapefiles.ts --file <path.shp> --county <Bonner|Boundary> [--limit N]");
    process.exit(1);
  }
  return {
    file: args.file,
    county: args.county as County,
    limit: args.limit ? Number(args.limit) : undefined,
  };
}

function centroidOf(poly: Polygon): { lat: number; lng: number } {
  // Cheap centroid: average of outer ring coordinates. Good enough for MVP indexing.
  const ring = poly.coordinates[0];
  let sx = 0, sy = 0;
  for (const [x, y] of ring) {
    sx += x;
    sy += y;
  }
  return { lat: sy / ring.length, lng: sx / ring.length };
}

function flattenToPolygon(geom: Polygon | MultiPolygon): Polygon {
  if (geom.type === "Polygon") return geom;
  // pick the largest ring by bounding-box area
  let best = geom.coordinates[0];
  let bestArea = -Infinity;
  for (const poly of geom.coordinates) {
    const ring = poly[0];
    const xs = ring.map((c) => c[0]);
    const ys = ring.map((c) => c[1]);
    const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    if (area > bestArea) {
      bestArea = area;
      best = poly;
    }
  }
  return { type: "Polygon", coordinates: best };
}

function placeholderEnrichment(): ParcelEnrichment {
  // Production wires in USGS DEM, NLCD canopy, OSM POIs, PAD-US adjacency.
  // For first imports we leave reasonable neutral defaults; an enrichment job
  // backfills these columns later.
  return {
    slopeDeg: 10,
    forestCoverPct: 50,
    nearestTown: "—",
    nearestTownMiles: 99,
    nearestSkiArea: "Schweitzer",
    nearestSkiMiles: 99,
    nearestAirport: "—",
    nearestAirportMiles: 99,
    publicLandAdjacent: false,
    waterMiles: 99,
    roadAccess: "Gravel",
    elevationFt: 2500,
    aspect: "Flat",
  };
}

async function main() {
  const args = parseArgs();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env.");
    process.exit(1);
  }

  console.log(`Reading ${args.file} as ${args.county} County parcels…`);
  const source = await open(args.file);

  let count = 0;
  let batch: Record<string, unknown>[] = [];
  const FLUSH = 200;

  async function flush() {
    if (batch.length === 0) return;
    const { error } = await supabase.from("parcels").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error("upsert error:", error);
      process.exit(1);
    }
    console.log(`  upserted ${batch.length} (running total ${count})`);
    batch = [];
  }

  while (true) {
    const result = await source.read();
    if (result.done) break;
    if (args.limit && count >= args.limit) break;

    const feature = result.value as Feature<Polygon | MultiPolygon, Record<string, unknown>>;
    if (!feature.geometry) continue;

    const polygon = flattenToPolygon(feature.geometry);
    const c = centroidOf(polygon);
    const props = feature.properties ?? {};

    const apn = String(props.PARCEL_ID ?? props.APN ?? props.PIN ?? `${args.county}-${count}`);
    const acresProp = Number(props.ACRES ?? props.GIS_ACRES ?? props.AREA_AC ?? 0);
    const acres = isFinite(acresProp) && acresProp > 0 ? acresProp : 1;

    const ownerName = (props.OWNER ?? props.OWNER_NAME) as string | undefined;
    const ownerCity = (props.OWN_CITY ?? props.OWNER_CITY) as string | undefined;
    const ownerState = (props.OWN_STATE ?? props.OWNER_STATE) as string | undefined;
    const landUse = (props.LAND_USE ?? props.USE) as string | undefined;
    const zoning = (props.ZONING) as string | undefined;

    const e = placeholderEnrichment();
    const partial: Parcel = {
      id: `${args.county.toLowerCase()}-${apn}`,
      apn,
      county: args.county,
      state: "ID",
      acres,
      centroidLat: c.lat,
      centroidLng: c.lng,
      geometry: polygon,
      ownerName,
      ownerCity,
      ownerState,
      landUse,
      zoning,
      enrichment: e,
      scores: { privacy: 0, beauty: 0, buildability: 0, recreation: 0, strPotential: 0, overall: 0 },
    };
    partial.scores = computeScores(partial);
    partial.aiSummary = deterministicSummary(partial);

    batch.push({
      id: partial.id,
      apn: partial.apn,
      county: partial.county,
      state: partial.state,
      acres: partial.acres,
      centroid_lat: partial.centroidLat,
      centroid_lng: partial.centroidLng,
      geom: `SRID=4326;POLYGON((${polygon.coordinates[0].map(([x, y]) => `${x} ${y}`).join(",")}))`,
      owner_name: ownerName ?? null,
      owner_city: ownerCity ?? null,
      owner_state: ownerState ?? null,
      land_use: landUse ?? null,
      zoning: zoning ?? null,

      slope_deg: e.slopeDeg,
      forest_cover_pct: e.forestCoverPct,
      nearest_town: e.nearestTown,
      nearest_town_miles: e.nearestTownMiles,
      nearest_ski_area: e.nearestSkiArea,
      nearest_ski_miles: e.nearestSkiMiles,
      nearest_airport: e.nearestAirport,
      nearest_airport_miles: e.nearestAirportMiles,
      public_land_adjacent: e.publicLandAdjacent,
      public_land_neighbor_mi: e.publicLandNeighborMiles ?? null,
      water_feature: e.waterFeature ?? null,
      water_miles: e.waterMiles,
      road_access: e.roadAccess,
      elevation_ft: e.elevationFt,
      aspect: e.aspect,

      score_privacy: partial.scores.privacy,
      score_beauty: partial.scores.beauty,
      score_buildability: partial.scores.buildability,
      score_recreation: partial.scores.recreation,
      score_str: partial.scores.strPotential,
      score_overall: partial.scores.overall,
      ai_summary: partial.aiSummary,

      updated_at: new Date().toISOString(),
    });

    count++;
    if (batch.length >= FLUSH) await flush();
  }
  await flush();

  console.log(`Done. ${count} parcels imported for ${args.county} County.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
