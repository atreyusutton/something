"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import {
  Map as MapLibre,
  Source,
  Layer,
  NavigationControl,
  ScaleControl,
  type MapRef,
} from "react-map-gl/maplibre";
import type { FillLayerSpecification, LineLayerSpecification, MapGeoJSONFeature } from "maplibre-gl";
import { useMemo, useRef } from "react";
import type { Parcel } from "@/lib/types";
import { buildStyle, type BaseLayer } from "@/lib/map-styles";

const FILL_PAINT: FillLayerSpecification["paint"] = {
  "fill-color": [
    "interpolate",
    ["linear"],
    ["get", "overall"],
    0, "#6b5e4a",
    50, "#c9883f",
    75, "#8fae7e",
    90, "#b9d39e",
  ],
  "fill-opacity": [
    "case",
    ["boolean", ["feature-state", "selected"], false], 0.85,
    ["boolean", ["feature-state", "hover"], false], 0.75,
    0.55,
  ],
};

const LINE_PAINT: LineLayerSpecification["paint"] = {
  "line-color": [
    "case",
    ["boolean", ["feature-state", "selected"], false], "#1c1f1a",
    ["boolean", ["feature-state", "hover"], false], "#2f4a2c",
    "#3a3f33",
  ],
  "line-width": [
    "case",
    ["boolean", ["feature-state", "selected"], false], 2.6,
    ["boolean", ["feature-state", "hover"], false], 1.8,
    0.9,
  ],
};

export default function ParcelMap({
  parcels,
  selectedId,
  onSelect,
  baseLayer,
}: {
  parcels: Parcel[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  baseLayer: BaseLayer;
}) {
  const mapRef = useRef<MapRef | null>(null);
  const hoverIdRef = useRef<string | null>(null);

  const featureCollection = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: parcels.map((p) => ({
        type: "Feature" as const,
        id: p.id,
        geometry: p.geometry,
        properties: {
          id: p.id,
          overall: p.scores.overall,
          acres: p.acres,
          county: p.county,
        },
      })),
    }),
    [parcels],
  );

  // Only read on mount, so a parcel selected via deep link centers the map on it.
  const initialView = useMemo(() => {
    const selected = selectedId ? parcels.find((p) => p.id === selectedId) : undefined;
    if (selected) return { longitude: selected.centroidLng, latitude: selected.centroidLat, zoom: 13 };
    if (parcels.length === 0) return { longitude: -116.55, latitude: 48.5, zoom: 8.5 };
    const lats = parcels.map((p) => p.centroidLat);
    const lngs = parcels.map((p) => p.centroidLng);
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: 8.6,
    };
  }, [parcels, selectedId]);

  const style = useMemo(() => buildStyle(baseLayer), [baseLayer]);

  function handleMove(e: { features?: MapGeoJSONFeature[] }) {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const id = (e.features?.[0]?.id as string | number | undefined) ?? null;
    if (hoverIdRef.current && hoverIdRef.current !== id) {
      map.setFeatureState({ source: "parcels", id: hoverIdRef.current }, { hover: false });
    }
    if (id !== null) {
      map.setFeatureState({ source: "parcels", id: id as string }, { hover: true });
      hoverIdRef.current = id as string;
      map.getCanvas().style.cursor = "pointer";
    } else {
      hoverIdRef.current = null;
      map.getCanvas().style.cursor = "";
    }
  }

  return (
    <MapLibre
      ref={mapRef}
      initialViewState={initialView}
      mapStyle={style}
      interactiveLayerIds={["parcels-fill"]}
      onMouseMove={handleMove}
      onMouseLeave={() => {
        const map = mapRef.current?.getMap();
        if (map && hoverIdRef.current) {
          map.setFeatureState({ source: "parcels", id: hoverIdRef.current }, { hover: false });
          hoverIdRef.current = null;
          map.getCanvas().style.cursor = "";
        }
      }}
      onClick={(e) => {
        const f = e.features?.[0];
        if (f && f.id) onSelect(f.id as string);
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <ScaleControl unit="imperial" position="bottom-right" />

      <Source id="parcels" type="geojson" data={featureCollection} promoteId="id">
        <Layer id="parcels-fill" type="fill" paint={FILL_PAINT} />
        <Layer id="parcels-line" type="line" paint={LINE_PAINT} />
      </Source>

      <SelectedFeatureSync mapRef={mapRef} selectedId={selectedId ?? null} />
    </MapLibre>
  );
}

function SelectedFeatureSync({
  mapRef,
  selectedId,
}: {
  mapRef: React.RefObject<MapRef | null>;
  selectedId: string | null;
}) {
  // re-apply selection state every render (cheap; <100 parcels)
  const map = mapRef.current?.getMap();
  if (map && map.isStyleLoaded() && map.getSource("parcels")) {
    // clear previous selections — feature-state is sticky otherwise
    const features = map.querySourceFeatures("parcels");
    for (const f of features) {
      if (f.id !== undefined) {
        map.setFeatureState(
          { source: "parcels", id: f.id as string },
          { selected: f.id === selectedId },
        );
      }
    }
  }
  return null;
}
