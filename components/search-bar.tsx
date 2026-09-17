"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

const EXAMPLES = [
  "5–20 wooded acres near skiing",
  "private mountain land bordering National Forest",
  "buildable creek parcel near Sandpoint",
  "off-grid 40+ acres in Boundary County",
];

export function SearchBar({
  value,
  onChange,
  onSubmit,
  matched,
  describe,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  matched: number;
  describe: string;
  loading?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(value);
        }}
        className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 h-11 focus-within:border-primary/60 transition"
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder="Describe the land you want…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            clear
          </button>
        )}
        <button
          type="submit"
          className="text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>{describe}</span>
        </div>
        <div>
          <span className="text-foreground font-medium tabular-nums">{matched}</span> match
        </div>
      </div>

      {focused && !value && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-panel shadow-xl p-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">
            Try
          </div>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(ex);
                onSubmit(ex);
              }}
              className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
