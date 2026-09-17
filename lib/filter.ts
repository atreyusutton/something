import type { Parcel, ParcelFilter } from "./types";

export function applyFilter(parcels: Parcel[], f: ParcelFilter): Parcel[] {
  return parcels.filter((p) => {
    if (f.county && p.county !== f.county) return false;
    if (f.acresMin !== undefined && p.acres < f.acresMin) return false;
    if (f.acresMax !== undefined && p.acres > f.acresMax) return false;
    if (f.publicLandAdjacent && !p.enrichment.publicLandAdjacent) return false;
    if (f.waterMaxMiles !== undefined && p.enrichment.waterMiles > f.waterMaxMiles) return false;
    if (f.skiMaxMiles !== undefined && p.enrichment.nearestSkiMiles > f.skiMaxMiles) return false;
    if (f.townMaxMiles !== undefined && p.enrichment.nearestTownMiles > f.townMaxMiles) return false;
    if (f.forestMinPct !== undefined && p.enrichment.forestCoverPct < f.forestMinPct) return false;
    if (f.slopeMaxDeg !== undefined && p.enrichment.slopeDeg > f.slopeMaxDeg) return false;
    if (f.minOverall !== undefined && p.scores.overall < f.minOverall) return false;
    return true;
  });
}
