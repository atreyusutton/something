// Tiny geo helpers — build a roughly-square polygon from centroid + acres.

import type { Polygon } from "geojson";

const FT_PER_DEG_LAT = 364_000; // ~constant
const FT_PER_DEG_LNG_AT_48 = 243_000; // good enough for North Idaho

const SQFT_PER_ACRE = 43_560;

export function squarePolygonFromCentroid(
  lat: number,
  lng: number,
  acres: number,
  aspectRatio = 1,
): Polygon {
  const sideFt = Math.sqrt(acres * SQFT_PER_ACRE);
  const widthFt = sideFt * aspectRatio;
  const heightFt = sideFt / aspectRatio;
  const dLat = heightFt / 2 / FT_PER_DEG_LAT;
  const dLng = widthFt / 2 / FT_PER_DEG_LNG_AT_48;
  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  };
}
