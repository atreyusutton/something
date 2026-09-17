// Deep links into /discover. The filter travels in the URL (not a scout id) so links
// work on any device, even without the scout in local storage.

import type { ParcelFilter } from "./types";

const FILTER_PARAM = "filter";
const PARCEL_PARAM = "parcel";

export function discoverHref({ filter, parcelId }: { filter?: ParcelFilter; parcelId?: string }): string {
  const params = new URLSearchParams();
  if (filter && Object.keys(filter).length > 0) params.set(FILTER_PARAM, JSON.stringify(filter));
  if (parcelId) params.set(PARCEL_PARAM, parcelId);
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

export function readDiscoverParams(params: URLSearchParams): {
  filter: ParcelFilter;
  parcelId: string | null;
} {
  return {
    filter: parseFilter(params.get(FILTER_PARAM)),
    parcelId: params.get(PARCEL_PARAM),
  };
}

function parseFilter(raw: string | null): ParcelFilter {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as ParcelFilter;
    console.warn("Ignoring non-object filter in /discover URL", parsed);
  } catch (err) {
    console.warn("Ignoring malformed filter in /discover URL", err);
  }
  return {};
}
