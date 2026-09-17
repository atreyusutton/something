"use client";

import type { County, ParcelFilter } from "@/lib/types";

const COUNTIES: County[] = ["Bonner", "Boundary"];

export function FilterPanel({
  filter,
  onChange,
  onSaveScout,
}: {
  filter: ParcelFilter;
  onChange: (f: ParcelFilter) => void;
  onSaveScout: () => void;
}) {
  function set<K extends keyof ParcelFilter>(key: K, v: ParcelFilter[K]) {
    onChange({ ...filter, [key]: v });
  }
  function toggle<K extends keyof ParcelFilter>(key: K, v: ParcelFilter[K]) {
    const next = filter[key] === v ? undefined : v;
    onChange({ ...filter, [key]: next as ParcelFilter[K] });
  }

  return (
    <div className="space-y-5">
      <Group label="County">
        <div className="flex gap-1.5 flex-wrap">
          {COUNTIES.map((c) => (
            <Chip key={c} active={filter.county === c} onClick={() => toggle("county", c)}>
              {c}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label="Acres">
        <div className="flex items-center gap-2">
          <NumInput
            value={filter.acresMin}
            onChange={(v) => set("acresMin", v)}
            placeholder="Min"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <NumInput
            value={filter.acresMax}
            onChange={(v) => set("acresMax", v)}
            placeholder="Max"
          />
        </div>
      </Group>

      <Group label="Lifestyle">
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={!!filter.publicLandAdjacent}
            onClick={() => set("publicLandAdjacent", filter.publicLandAdjacent ? undefined : true)}
          >
            Borders public land
          </Chip>
          <Chip
            active={(filter.waterMaxMiles ?? 99) <= 1.5}
            onClick={() => set("waterMaxMiles", filter.waterMaxMiles ? undefined : 1.5)}
          >
            Near water
          </Chip>
          <Chip
            active={(filter.skiMaxMiles ?? 999) <= 35}
            onClick={() => set("skiMaxMiles", filter.skiMaxMiles ? undefined : 35)}
          >
            Near skiing
          </Chip>
          <Chip
            active={(filter.townMaxMiles ?? 999) <= 12}
            onClick={() => set("townMaxMiles", filter.townMaxMiles ? undefined : 12)}
          >
            Close to town
          </Chip>
          <Chip
            active={(filter.forestMinPct ?? 0) >= 60}
            onClick={() => set("forestMinPct", filter.forestMinPct ? undefined : 60)}
          >
            Wooded
          </Chip>
          <Chip
            active={(filter.slopeMaxDeg ?? 99) <= 18}
            onClick={() => set("slopeMaxDeg", filter.slopeMaxDeg ? undefined : 18)}
          >
            Buildable
          </Chip>
        </div>
      </Group>

      <Group label="Minimum overall score">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={filter.minOverall ?? 0}
          onChange={(e) => set("minOverall", Number(e.target.value) || undefined)}
          className="w-full accent-[var(--primary)]"
        />
        <div className="text-xs text-muted-foreground tabular-nums">
          {filter.minOverall ? `≥ ${filter.minOverall}` : "any"}
        </div>
      </Group>

      <button
        onClick={onSaveScout}
        className="w-full px-3 py-2 rounded-md border border-border bg-panel hover:bg-muted text-sm transition"
      >
        Save as scout
      </button>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-panel border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      placeholder={placeholder}
      className="w-full rounded-md border border-border bg-panel px-2 py-1.5 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary/60"
    />
  );
}
