"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getParcels } from "@/lib/mock-data";
import { applyFilter } from "@/lib/filter";
import { describeFilter } from "@/lib/nl-parse";
import { listScoutsSeedingDemos, loadDemoScouts, removeScout } from "@/lib/scouts-store";
import { discoverHref } from "@/lib/discover-url";
import type { Scout } from "@/lib/types";
import { Trash2, MapIcon } from "lucide-react";
import { formatAcres, formatMiles } from "@/lib/utils";

const ALL = getParcels();

export default function ScoutsPage() {
  const [scouts, setScouts] = useState<Scout[] | null>(null);

  useEffect(() => {
    setScouts(listScoutsSeedingDemos());
  }, []);

  if (scouts === null) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-12 w-full text-sm text-muted-foreground">
        Loading scouts…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-12 w-full">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Saved scouts
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Your standing searches.</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Save a search and rerun it later. Each scout matches against the curated parcel set —
            new parcels show up automatically when they fit.
          </p>
        </div>
        <Link
          href="/discover"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
        >
          Build a scout
        </Link>
      </div>

      {scouts.length === 0 ? (
        <EmptyState onLoadDemos={() => setScouts(loadDemoScouts())} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {scouts.map((s) => (
            <ScoutCard
              key={s.id}
              scout={s}
              onDelete={() => setScouts(removeScout(s.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScoutCard({ scout, onDelete }: { scout: Scout; onDelete: () => void }) {
  const matches = useMemo(() => applyFilter(ALL, scout.filter), [scout.filter]);
  const top = matches.sort((a, b) => b.scores.overall - a.scores.overall).slice(0, 3);

  return (
    <div className="rounded-lg border border-border bg-panel p-5 hover:border-primary/40 transition flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium leading-snug truncate">{scout.name}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Saved {new Date(scout.createdAt).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete scout"
          className="text-muted-foreground hover:text-foreground p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs text-muted-foreground mt-3 leading-relaxed">
        {describeFilter(scout.filter)}
      </div>

      <div className="border-t border-border my-4" />

      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
        {matches.length} match{matches.length === 1 ? "" : "es"}
      </div>
      <div className="space-y-1.5 flex-1">
        {top.length === 0 ? (
          <div className="text-xs text-muted-foreground">No parcels match yet.</div>
        ) : (
          top.map((p) => (
            <Link
              key={p.id}
              href={discoverHref({ filter: scout.filter, parcelId: p.id })}
              className="flex items-center justify-between rounded border border-border bg-panel-2 px-2.5 py-1.5 hover:border-primary/40 transition"
            >
              <div className="min-w-0">
                <div className="text-sm">{formatAcres(p.acres)} · {p.county}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {p.enrichment.nearestTown} · {formatMiles(p.enrichment.nearestTownMiles)}
                </div>
              </div>
              <div className="text-[11px] tabular-nums px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                {p.scores.overall}
              </div>
            </Link>
          ))
        )}
      </div>

      <Link
        href={discoverHref({ filter: scout.filter })}
        className="mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border bg-panel hover:bg-muted text-sm transition"
      >
        <MapIcon className="w-4 h-4" />
        Open in map
      </Link>
    </div>
  );
}

function EmptyState({ onLoadDemos }: { onLoadDemos: () => void }) {
  return (
    <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
      <div className="text-sm text-muted-foreground">No saved scouts yet.</div>
      <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
        <Link
          href="/discover"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
        >
          Build your first scout
        </Link>
        <button
          onClick={onLoadDemos}
          className="px-4 py-2 rounded-md border border-border bg-panel hover:bg-muted text-sm transition"
        >
          Load demo scouts
        </button>
      </div>
    </div>
  );
}
