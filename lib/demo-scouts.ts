// Pre-built scouts for demos. Seeded into local storage on a first visit to /scouts,
// and restorable from the empty state. Filters are tuned to match the mock parcel set.

import type { Scout } from "./types";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export function getDemoScouts(): Scout[] {
  return [
    {
      id: "demo-waterfront",
      name: "Bonner County waterfront retreat",
      filter: {
        query: "5+ acres within half a mile of water in Bonner County",
        county: "Bonner",
        acresMin: 5,
        waterMaxMiles: 0.5,
      },
      createdAt: daysAgo(2),
      notes: "Lake or river frontage for a summer place.",
    },
    {
      id: "demo-ski-cabin",
      name: "Ski-season cabin",
      filter: {
        query: "wooded land within 25 miles of a ski hill, not too steep",
        skiMaxMiles: 25,
        forestMinPct: 60,
        slopeMaxDeg: 20,
      },
      createdAt: daysAgo(5),
      notes: "Close enough to Schweitzer for weekend runs.",
    },
    {
      id: "demo-public-land",
      name: "Big timber bordering public land",
      filter: {
        query: "40+ acres adjacent to national forest or BLM",
        acresMin: 40,
        publicLandAdjacent: true,
      },
      createdAt: daysAgo(9),
      notes: "Hunting and trail access out the back door.",
    },
    {
      id: "demo-homestead",
      name: "Boundary County homestead",
      filter: {
        query: "gentle slope within 15 miles of town in Boundary County",
        county: "Boundary",
        townMaxMiles: 15,
        slopeMaxDeg: 12,
      },
      createdAt: daysAgo(14),
      notes: "Buildable ground for a garden and outbuildings.",
    },
    {
      id: "demo-top-scored",
      name: "Top-scored parcels only",
      filter: {
        query: "anything with an overall score of 80 or higher",
        minOverall: 80,
      },
      createdAt: daysAgo(21),
    },
  ];
}
