"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { Parcel } from "@/lib/types";
import { formatAcres, formatMiles } from "@/lib/utils";
import { prosCons } from "@/lib/ai-summary";

export function ParcelDrawer({
  parcel,
  open,
  onOpenChange,
  aiSummary,
  aiSource,
}: {
  parcel: Parcel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiSummary?: string;
  aiSource?: "ai" | "deterministic" | "loading";
}) {
  if (!parcel) return null;
  const { pros, cons } = prosCons(parcel);
  const summary = aiSummary ?? parcel.aiSummary ?? "";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-panel border-l border-border shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <Dialog.Title className="sr-only">Parcel details</Dialog.Title>
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {parcel.county} County · APN {parcel.apn}
            </div>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto px-5 py-5 space-y-6">
            {/* Headline */}
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">{formatAcres(parcel.acres)}</h2>
                <ScoreBadge label="Overall" value={parcel.scores.overall} />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Near {parcel.enrichment.nearestTown} · {parcel.enrichment.elevationFt.toLocaleString()} ft ·{" "}
                {parcel.enrichment.aspect}-facing
              </div>
            </div>

            {/* AI summary */}
            <Section title={aiSource === "ai" ? "AI summary" : "Summary"}>
              <p className="text-sm leading-relaxed">{summary || "—"}</p>
              {aiSource === "loading" && (
                <p className="text-[11px] text-muted-foreground mt-2">Asking the model…</p>
              )}
              {aiSource === "deterministic" && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Generated from parcel attributes. Set <code>OPENAI_API_KEY</code> for richer summaries.
                </p>
              )}
            </Section>

            {/* Scores */}
            <Section title="Parcel scores">
              <div className="grid grid-cols-2 gap-2">
                <ScoreRow label="Privacy" value={parcel.scores.privacy} />
                <ScoreRow label="Beauty" value={parcel.scores.beauty} />
                <ScoreRow label="Buildability" value={parcel.scores.buildability} />
                <ScoreRow label="Recreation" value={parcel.scores.recreation} />
                <ScoreRow label="STR potential" value={parcel.scores.strPotential} />
              </div>
            </Section>

            {/* Pros / Cons */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-panel-2 p-3">
                <div className="text-[11px] uppercase tracking-wider text-primary mb-2">Pros</div>
                <ul className="space-y-1.5 text-sm">
                  {pros.length === 0 ? <li className="text-muted-foreground">—</li> :
                    pros.map((p) => <li key={p} className="leading-snug">{p}</li>)}
                </ul>
              </div>
              <div className="rounded-md border border-border bg-panel-2 p-3">
                <div className="text-[11px] uppercase tracking-wider text-accent mb-2">Trade-offs</div>
                <ul className="space-y-1.5 text-sm">
                  {cons.length === 0 ? <li className="text-muted-foreground">—</li> :
                    cons.map((c) => <li key={c} className="leading-snug">{c}</li>)}
                </ul>
              </div>
            </div>

            {/* Terrain + access */}
            <Section title="Terrain & access">
              <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                <Field label="Slope" value={`${parcel.enrichment.slopeDeg.toFixed(0)}° avg`} />
                <Field label="Forest cover" value={`${parcel.enrichment.forestCoverPct}%`} />
                <Field label="Aspect" value={parcel.enrichment.aspect} />
                <Field label="Elevation" value={`${parcel.enrichment.elevationFt.toLocaleString()} ft`} />
                <Field label="Road" value={parcel.enrichment.roadAccess} />
                <Field
                  label="Public land"
                  value={
                    parcel.enrichment.publicLandAdjacent
                      ? "Adjacent"
                      : parcel.enrichment.publicLandNeighborMiles !== undefined
                        ? `${formatMiles(parcel.enrichment.publicLandNeighborMiles)} away`
                        : "—"
                  }
                />
                <Field
                  label="Water"
                  value={
                    parcel.enrichment.waterFeature
                      ? `${parcel.enrichment.waterFeature} · ${formatMiles(parcel.enrichment.waterMiles)}`
                      : "—"
                  }
                />
                <Field label="Land use" value={parcel.landUse ?? "—"} />
              </dl>
            </Section>

            {/* Proximity */}
            <Section title="Proximity">
              <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                <Field
                  label="Nearest town"
                  value={`${parcel.enrichment.nearestTown} · ${formatMiles(parcel.enrichment.nearestTownMiles)}`}
                />
                <Field
                  label="Nearest ski"
                  value={`${parcel.enrichment.nearestSkiArea} · ${formatMiles(parcel.enrichment.nearestSkiMiles)}`}
                />
                <Field
                  label="Nearest airport"
                  value={`${parcel.enrichment.nearestAirport} · ${formatMiles(parcel.enrichment.nearestAirportMiles)}`}
                />
                <Field label="Centroid" value={`${parcel.centroidLat.toFixed(4)}, ${parcel.centroidLng.toFixed(4)}`} />
              </dl>
            </Section>

            {/* Owner (public placeholder) */}
            <Section title="Owner (from public records)">
              <div className="rounded-md border border-border bg-panel-2 px-3 py-2.5 text-sm font-medium tracking-wide">
                {parcel.ownerName ?? "—"}
              </div>
              <dl className="grid grid-cols-2 gap-y-2.5 text-sm mt-3">
                <Field label="Mailing city" value={parcel.ownerCity ?? "—"} />
                <Field label="Mailing state" value={parcel.ownerState ?? "—"} />
              </dl>
              <p className="text-[11px] text-muted-foreground mt-3">
                Owner identity is loaded from county assessor records when available. This MVP
                does not facilitate outreach.
              </p>
            </Section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{title}</div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm text-right truncate">{value}</dd>
    </>
  );
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 75 ? "bg-score-high text-primary-foreground"
      : value >= 50 ? "bg-score-mid text-accent-foreground"
        : "bg-score-low text-primary-foreground";
  return (
    <div className={`rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums ${color}`}>
      {label} {value}
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "bg-score-high" : value >= 50 ? "bg-score-mid" : "bg-score-low";
  return (
    <div className="rounded-md border border-border bg-panel-2 px-2.5 py-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold tabular-nums">{value}</div>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
