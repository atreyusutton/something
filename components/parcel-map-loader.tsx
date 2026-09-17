"use client";

import dynamic from "next/dynamic";
import type { Parcel } from "@/lib/types";
import type { BaseLayer } from "@/lib/map-styles";

const ParcelMap = dynamic(() => import("./parcel-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export default function ParcelMapLoader(props: {
  parcels: Parcel[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  baseLayer: BaseLayer;
}) {
  return <ParcelMap {...props} />;
}
