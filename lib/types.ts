// Core parcel types for the North Idaho MVP.
// Geometry is GeoJSON Polygon (one ring; multipolygons are flattened on import).

import type { Polygon } from "geojson";

export type County = "Bonner" | "Boundary";

export interface ParcelEnrichment {
  slopeDeg: number;             // mean slope in degrees (0–60)
  forestCoverPct: number;       // 0–100, % canopy
  nearestTown: string;
  nearestTownMiles: number;
  nearestSkiArea: string;
  nearestSkiMiles: number;
  nearestAirport: string;
  nearestAirportMiles: number;
  publicLandAdjacent: boolean;  // touches USFS / BLM / state
  publicLandNeighborMiles?: number;
  waterFeature?: string;        // "Pack River", "Pend Oreille", etc.
  waterMiles: number;
  roadAccess: "Paved" | "Gravel" | "Seasonal" | "Unimproved";
  elevationFt: number;
  aspect: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "Flat";
}

export interface ParcelScores {
  privacy: number;        // 0–100
  beauty: number;         // 0–100
  buildability: number;   // 0–100
  recreation: number;     // 0–100
  strPotential: number;   // 0–100 (short-term-rental fit)
  overall: number;        // 0–100 weighted
}

export interface Parcel {
  id: string;             // internal id
  apn: string;            // assessor's parcel number
  county: County;
  state: "ID";
  acres: number;
  centroidLat: number;
  centroidLng: number;
  geometry: Polygon;

  ownerName?: string;     // public if available
  ownerCity?: string;
  ownerState?: string;
  landUse?: string;
  zoning?: string;        // placeholder for MVP

  enrichment: ParcelEnrichment;
  scores: ParcelScores;
  aiSummary?: string;     // computed; cached
}

// ---------- search / scouts ----------

export interface ParcelFilter {
  query?: string;
  acresMin?: number;
  acresMax?: number;
  county?: County;
  publicLandAdjacent?: boolean;
  waterMaxMiles?: number;
  skiMaxMiles?: number;
  townMaxMiles?: number;
  forestMinPct?: number;
  slopeMaxDeg?: number;
  minOverall?: number;
}

export interface Scout {
  id: string;
  name: string;
  filter: ParcelFilter;
  createdAt: string;       // ISO
  notes?: string;
}
