// Local-storage backed scout persistence. Keeps the MVP free; production can swap
// in Supabase by replacing these functions.

import type { Scout } from "./types";
import { getDemoScouts } from "./demo-scouts";

const KEY = "something:scouts:v1";

export function listScouts(): Scout[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScouts(scouts: Scout[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(scouts));
}

export function addScout(scout: Scout): Scout[] {
  const next = [scout, ...listScouts()];
  saveScouts(next);
  return next;
}

export function removeScout(id: string): Scout[] {
  const next = listScouts().filter((s) => s.id !== id);
  saveScouts(next);
  return next;
}

// Seeds demo scouts only when nothing has ever been stored, so deleting them all sticks.
export function listScoutsSeedingDemos(): Scout[] {
  if (typeof window === "undefined") return [];
  let neverStored: boolean;
  try {
    neverStored = window.localStorage.getItem(KEY) === null;
  } catch (err) {
    console.warn("Scout storage unavailable; skipping demo seed", err);
    return [];
  }
  return neverStored ? loadDemoScouts() : listScouts();
}

// Adds any demo scouts that aren't already saved, keeping the user's own scouts.
export function loadDemoScouts(): Scout[] {
  const existing = listScouts();
  const ids = new Set(existing.map((s) => s.id));
  const next = [...existing, ...getDemoScouts().filter((s) => !ids.has(s.id))];
  saveScouts(next);
  return next;
}
