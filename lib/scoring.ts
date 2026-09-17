import type { Parcel, ParcelEnrichment, ParcelScores } from "./types";

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// Privacy: rewards low road access, distance from town, large acreage, public-land buffer.
function privacyScore(p: { acres: number; e: ParcelEnrichment }) {
  const acresPart = clamp(Math.log10(Math.max(p.acres, 0.5)) * 30 + 35);
  const accessPart =
    p.e.roadAccess === "Unimproved" ? 90
      : p.e.roadAccess === "Seasonal" ? 78
        : p.e.roadAccess === "Gravel" ? 60
          : 38;
  const townPart = clamp(p.e.nearestTownMiles * 6 + 30);
  const publicPart = p.e.publicLandAdjacent ? 18 : 0;
  return clamp(acresPart * 0.35 + accessPart * 0.35 + townPart * 0.2 + publicPart);
}

// Beauty: forest cover, water proximity, public-land adjacency, elevation, aspect.
function beautyScore(e: ParcelEnrichment) {
  const forestPart = clamp(e.forestCoverPct);
  const waterPart = clamp(100 - e.waterMiles * 18);
  const publicPart = e.publicLandAdjacent ? 88 : clamp(70 - (e.publicLandNeighborMiles ?? 5) * 6);
  const elevPart = clamp((e.elevationFt - 1500) / 30 + 50);
  const aspectPart =
    e.aspect === "S" || e.aspect === "SE" || e.aspect === "SW" ? 88 : e.aspect === "Flat" ? 70 : 60;
  return clamp(forestPart * 0.3 + waterPart * 0.25 + publicPart * 0.2 + elevPart * 0.1 + aspectPart * 0.15);
}

// Buildability: penalizes steep slope and seasonal/unimproved access; rewards road + flatter ground.
function buildabilityScore(e: ParcelEnrichment) {
  const slopePart = clamp(100 - e.slopeDeg * 3.2);
  const accessPart =
    e.roadAccess === "Paved" ? 95
      : e.roadAccess === "Gravel" ? 80
        : e.roadAccess === "Seasonal" ? 50
          : 28;
  const aspectPart = e.aspect === "N" ? 60 : e.aspect === "Flat" ? 90 : 78;
  const elevPart = clamp(95 - Math.max(0, e.elevationFt - 4500) / 30);
  return clamp(slopePart * 0.4 + accessPart * 0.35 + aspectPart * 0.1 + elevPart * 0.15);
}

// Recreation: ski + water + public land.
function recreationScore(e: ParcelEnrichment) {
  const skiPart = clamp(100 - e.nearestSkiMiles * 1.6);
  const waterPart = clamp(100 - e.waterMiles * 14);
  const publicPart = e.publicLandAdjacent ? 92 : clamp(80 - (e.publicLandNeighborMiles ?? 6) * 5);
  return clamp(skiPart * 0.35 + waterPart * 0.3 + publicPart * 0.35);
}

// STR potential: town access, beauty, recreation, road quality.
function strPotentialScore(p: { acres: number; e: ParcelEnrichment }, beauty: number, rec: number) {
  const accessPart =
    p.e.roadAccess === "Paved" ? 92 : p.e.roadAccess === "Gravel" ? 78 : 35;
  const townPart = clamp(100 - p.e.nearestTownMiles * 5);
  return clamp(accessPart * 0.25 + townPart * 0.2 + beauty * 0.3 + rec * 0.25);
}

export function computeScores(p: { acres: number; enrichment: ParcelEnrichment }): ParcelScores {
  const e = p.enrichment;
  const privacy = Math.round(privacyScore({ acres: p.acres, e }));
  const beauty = Math.round(beautyScore(e));
  const buildability = Math.round(buildabilityScore(e));
  const recreation = Math.round(recreationScore(e));
  const strPotential = Math.round(strPotentialScore({ acres: p.acres, e }, beauty, recreation));
  const overall = Math.round(
    privacy * 0.2 + beauty * 0.3 + buildability * 0.2 + recreation * 0.2 + strPotential * 0.1,
  );
  return { privacy, beauty, buildability, recreation, strPotential, overall };
}

export function rescoreParcel<T extends Parcel>(p: T): T {
  return { ...p, scores: computeScores(p) };
}
