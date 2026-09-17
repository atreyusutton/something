// MapLibre style.json builders for free, key-less tile sources.
// Three vibes: Topo (default), Light, Satellite.

import type { StyleSpecification } from "maplibre-gl";

export type BaseLayer = "topo" | "light" | "satellite";

const ATTR_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ATTR_ESRI_GRAY = "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ";

export function buildStyle(base: BaseLayer): StyleSpecification {
  if (base === "topo") {
    return {
      version: 8,
      sources: {
        "opentopo": {
          type: "raster",
          tiles: [
            "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
            "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
            "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          maxzoom: 17,
          attribution: `${ATTR_OSM}, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`,
        },
      },
      layers: [
        { id: "background", type: "background", paint: { "background-color": "#faf7f2" } },
        { id: "opentopo", type: "raster", source: "opentopo", paint: { "raster-opacity": 0.95 } },
      ],
    };
  }
  if (base === "light") {
    // CARTO basemaps now watermark tiles with "API KEY REQUIRED"; Esri Light Gray is still key-less.
    return {
      version: 8,
      sources: {
        "esri-light-gray": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 16,
          attribution: ATTR_ESRI_GRAY,
        },
        "esri-light-gray-labels": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 16,
        },
      },
      layers: [
        { id: "background", type: "background", paint: { "background-color": "#faf7f2" } },
        { id: "esri-light-gray", type: "raster", source: "esri-light-gray" },
        { id: "esri-light-gray-labels", type: "raster", source: "esri-light-gray-labels" },
      ],
    };
  }
  // satellite
  return {
    version: 8,
    sources: {
      "esri-imagery": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#1c1f1a" } },
      { id: "esri-imagery", type: "raster", source: "esri-imagery" },
    ],
  };
}
