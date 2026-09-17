// Natural-language → structured ParcelFilter.
// Deterministic by default; if OPENAI_API_KEY is set, the API route may upgrade
// to model-assisted parsing. Both produce the same shape.

import type { ParcelFilter } from "./types";

const NUM = /(\d+(?:\.\d+)?)/g;

export function parseNL(query: string): ParcelFilter {
  const q = query.toLowerCase().trim();
  const filter: ParcelFilter = { query };

  // acreage range "5-20 acres", "5 to 20 acres", "10+ acres", "under 5"
  const range = q.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)\s*(?:acre|ac\b)/);
  if (range) {
    filter.acresMin = Number(range[1]);
    filter.acresMax = Number(range[2]);
  } else {
    const plus = q.match(/(\d+(?:\.\d+)?)\+\s*(?:acre|ac\b)/);
    const over = q.match(/(?:over|more than|at least|\>=?|min(?:imum)?)\s*(\d+(?:\.\d+)?)\s*(?:acre|ac\b)/);
    const under = q.match(/(?:under|less than|max(?:imum)?|\<=?)\s*(\d+(?:\.\d+)?)\s*(?:acre|ac\b)/);
    if (plus) filter.acresMin = Number(plus[1]);
    if (over) filter.acresMin = Number(over[1]);
    if (under) filter.acresMax = Number(under[1]);
    if (!plus && !over && !under) {
      const single = q.match(/(\d+(?:\.\d+)?)\s*(?:acre|ac\b)/);
      if (single) {
        const n = Number(single[1]);
        filter.acresMin = Math.max(0, n - 2);
        filter.acresMax = n + 2;
      }
    }
  }

  // counties / regions
  if (/boundary|bonners ferry|moyie|naples\b/.test(q)) filter.county = "Boundary";
  if (/bonner|sandpoint|priest|hope\b|sagle|cocolalla|clark fork|dover|pack river/.test(q))
    filter.county = "Bonner";

  // public land / forest
  if (/(national forest|public land|usfs|blm|state land|wilderness|kaniksu|cabinet|selkirk)/.test(q)) {
    filter.publicLandAdjacent = true;
  }

  // water
  if (/(creek|river|lake|water|pond|stream|frontage|pend oreille|pack river|priest lake|kootenai|moyie)/.test(q)) {
    filter.waterMaxMiles = 1.5;
  }

  // ski / recreation
  if (/(ski|schweitzer|resort|powder|slope|mountain rec)/.test(q)) {
    filter.skiMaxMiles = 35;
  }

  // proximity to town
  if (/(near sandpoint|near town|close to town|close to sandpoint|near bonners ferry)/.test(q)) {
    filter.townMaxMiles = 12;
  }

  // wooded / forest
  if (/(wooded|forest|timber|cedar|conifer|trees)/.test(q)) {
    filter.forestMinPct = 60;
  }

  // privacy / off-grid / private
  if (/(private|secluded|off[- ]grid|remote|hidden|no neighbors)/.test(q)) {
    filter.minOverall = Math.max(filter.minOverall ?? 0, 60);
    filter.townMaxMiles = filter.townMaxMiles ?? 25; // not too far
  }

  // buildable / cabin / house
  if (/(buildable|cabin|build|house site|home site|home|build site)/.test(q)) {
    filter.slopeMaxDeg = 18;
  }

  // mountain / view
  if (/(mountain|view|ridge|peak|alpine)/.test(q)) {
    filter.minOverall = Math.max(filter.minOverall ?? 0, 55);
  }

  // catch numeric "X acres" if NUM matched without unit context
  if (filter.acresMin === undefined && filter.acresMax === undefined) {
    const nums = q.match(NUM);
    if (nums && /\bacre|ac\b/.test(q)) {
      const sorted = nums.map(Number).sort((a, b) => a - b);
      if (sorted.length >= 2) {
        filter.acresMin = sorted[0];
        filter.acresMax = sorted[sorted.length - 1];
      }
    }
  }

  return filter;
}

export function describeFilter(f: ParcelFilter): string {
  const parts: string[] = [];
  if (f.acresMin !== undefined || f.acresMax !== undefined) {
    parts.push(`${f.acresMin ?? 0}–${f.acresMax ?? "∞"} ac`);
  }
  if (f.county) parts.push(f.county + " Co.");
  if (f.publicLandAdjacent) parts.push("public land adj.");
  if (f.waterMaxMiles !== undefined) parts.push(`water ≤${f.waterMaxMiles}mi`);
  if (f.skiMaxMiles !== undefined) parts.push(`ski ≤${f.skiMaxMiles}mi`);
  if (f.townMaxMiles !== undefined) parts.push(`town ≤${f.townMaxMiles}mi`);
  if (f.forestMinPct !== undefined) parts.push(`forest ≥${f.forestMinPct}%`);
  if (f.slopeMaxDeg !== undefined) parts.push(`slope ≤${f.slopeMaxDeg}°`);
  if (f.minOverall !== undefined) parts.push(`overall ≥${f.minOverall}`);
  return parts.join(" · ") || "all parcels";
}
