"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getParcels } from "@/lib/mock-data";
import { readDiscoverParams } from "@/lib/discover-url";
import type { Parcel, ParcelFilter, Scout } from "@/lib/types";
import { applyFilter } from "@/lib/filter";
import { parseNL, describeFilter } from "@/lib/nl-parse";
import { addScout } from "@/lib/scouts-store";
import { SearchBar } from "@/components/search-bar";
import { FilterPanel } from "@/components/filter-panel";
import { ParcelDrawer } from "@/components/parcel-drawer";
import ParcelMapLoader from "@/components/parcel-map-loader";
import type { BaseLayer } from "@/lib/map-styles";
import { formatAcres, formatMiles } from "@/lib/utils";

const ALL = getParcels();

export default function DiscoverPage() {
  // useSearchParams needs a Suspense boundary or the production build fails.
  return (
    <Suspense
      fallback={
        <div className="flex-1 grid place-items-center min-h-[calc(100vh-3.5rem)] text-sm text-muted-foreground">
          Loading map…
        </div>
      }
    >
      <DiscoverView />
    </Suspense>
  );
}

function DiscoverView() {
  const searchParams = useSearchParams();
  // Deep links (e.g. from a scout card) only seed the initial state.
  const [initial] = useState(() => readDiscoverParams(searchParams));
  const [query, setQuery] = useState(initial.filter.query ?? "");
  const [filter, setFilter] = useState<ParcelFilter>(initial.filter);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.parcelId && ALL.some((p) => p.id === initial.parcelId) ? initial.parcelId : null,
  );
  const [aiSummary, setAiSummary] = useState<string | undefined>();
  const [aiSource, setAiSource] = useState<"ai" | "deterministic" | "loading" | undefined>();
  const [baseLayer, setBaseLayer] = useState<BaseLayer>("light");
  const [searching, setSearching] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const matches = useMemo(() => applyFilter(ALL, filter), [filter]);
  const selected = useMemo<Parcel | null>(
    () => (selectedId ? ALL.find((p) => p.id === selectedId) ?? null : null),
    [selectedId],
  );

  // Sorted top results for the side list
  const ranked = useMemo(
    () =>
      [...matches].sort((a, b) => b.scores.overall - a.scores.overall),
    [matches],
  );

  async function runSearch(q: string) {
    if (!q.trim()) {
      setFilter({});
      return;
    }
    setSearching(true);
    try {
      // Optimistic deterministic parse first
      const local = parseNL(q);
      setFilter(local);
      // Then upgrade with AI if available
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const json = (await res.json()) as { filter: ParcelFilter };
        if (json.filter) setFilter(json.filter);
      }
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!selected) {
      setAiSummary(undefined);
      setAiSource(undefined);
      return;
    }
    let cancelled = false;
    setAiSummary(selected.aiSummary);
    setAiSource("loading");
    fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id }),
    })
      .then((r) => r.json())
      .then((j: { summary?: string; source?: "ai" | "deterministic" }) => {
        if (cancelled) return;
        if (j.summary) setAiSummary(j.summary);
        setAiSource(j.source ?? "deterministic");
      })
      .catch(() => {
        if (!cancelled) setAiSource("deterministic");
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  function handleSaveScout() {
    const name = window.prompt("Name this scout", scoutName(query, filter)) ?? scoutName(query, filter);
    const scout: Scout = {
      id: `scout-${Date.now()}`,
      name,
      filter: { ...filter, query: query || filter.query },
      createdAt: new Date().toISOString(),
    };
    addScout(scout);
    setSavedToast(`Saved “${name}”`);
    setTimeout(() => setSavedToast(null), 2400);
  }

  return (
    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[340px_1fr] min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="border-r border-border bg-background sm:overflow-y-auto p-5 space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Discover
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={runSearch}
            matched={matches.length}
            describe={describeFilter(filter)}
            loading={searching}
          />
        </div>

        <FilterPanel filter={filter} onChange={setFilter} onSaveScout={handleSaveScout} />

        <div className="border-t border-border pt-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Top matches
          </div>
          <div className="space-y-2">
            {ranked.length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No parcels match these filters.
              </div>
            )}
            {ranked.slice(0, 12).map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left rounded-md border p-2.5 transition ${
                  selectedId === p.id
                    ? "border-primary bg-panel"
                    : "border-border bg-panel hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{formatAcres(p.acres)}</div>
                  <div className="text-[11px] tabular-nums px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                    {p.scores.overall}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {p.county} · {p.enrichment.nearestTown} · {formatMiles(p.enrichment.nearestTownMiles)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Map */}
      <section className="relative">
        <ParcelMapLoader
          parcels={matches}
          selectedId={selectedId}
          onSelect={setSelectedId}
          baseLayer={baseLayer}
        />
        <BaseLayerToggle current={baseLayer} onChange={setBaseLayer} />
        {savedToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 rounded-md border border-border bg-panel px-3 py-1.5 text-xs shadow-lg">
            {savedToast}
          </div>
        )}
      </section>

      <ParcelDrawer
        parcel={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        aiSummary={aiSummary}
        aiSource={aiSource}
      />
    </div>
  );
}

function BaseLayerToggle({
  current,
  onChange,
}: {
  current: BaseLayer;
  onChange: (b: BaseLayer) => void;
}) {
  const opts: { id: BaseLayer; label: string }[] = [
    { id: "light", label: "Light" },
    { id: "topo", label: "Topo" },
    { id: "satellite", label: "Satellite" },
  ];
  return (
    <div className="absolute top-3 left-3 z-20 rounded-md border border-border bg-panel/95 backdrop-blur p-1 flex gap-0.5 text-xs shadow-lg">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1 rounded transition ${
            current === o.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function scoutName(query: string, f: ParcelFilter): string {
  if (query) return query;
  return describeFilter(f) || "New scout";
}
