// Generates a short, evocative parcel summary.
// Deterministic by default. If OPENAI_API_KEY is set in the environment,
// the API route at /api/summary may upgrade to a model-generated summary.

import type { Parcel } from "./types";

export function deterministicSummary(p: Parcel): string {
  const e = p.enrichment;
  const s = p.scores;

  const aspectPhrase =
    e.aspect === "S" || e.aspect === "SE" || e.aspect === "SW"
      ? "south-facing"
      : e.aspect === "N"
        ? "north-facing"
        : e.aspect === "Flat"
          ? "level"
          : "well-oriented";

  const treesPhrase =
    e.forestCoverPct >= 75 ? "Heavily wooded"
      : e.forestCoverPct >= 45 ? "Mostly wooded"
        : e.forestCoverPct >= 20 ? "Partly wooded"
          : "Open meadow";

  const accessPhrase =
    e.roadAccess === "Paved" ? "year-round paved access"
      : e.roadAccess === "Gravel" ? "year-round gravel access"
        : e.roadAccess === "Seasonal" ? "seasonal road access"
          : "unimproved access";

  const publicPhrase = e.publicLandAdjacent
    ? `bordering public land`
    : (e.publicLandNeighborMiles ?? 99) < 1.5
      ? `near public land`
      : "";

  const waterPhrase = e.waterMiles < 0.3
    ? `with frontage on ${e.waterFeature ?? "water"}`
    : e.waterMiles < 1.5
      ? `near ${e.waterFeature ?? "water"}`
      : "";

  const skiPhrase = e.nearestSkiMiles < 25 ? `${Math.round(e.nearestSkiMiles)} mi to ${e.nearestSkiArea}` : "";
  const townPhrase = `${Math.round(e.nearestTownMiles)} mi to ${e.nearestTown}`;

  const cabinPhrase =
    s.buildability >= 70
      ? "strong cabin or home-site potential"
      : s.buildability >= 50
        ? "workable building site with site prep"
        : "challenging to build, best as a recreation hold";

  const lead = [
    `${treesPhrase} ${aspectPhrase} parcel`,
    publicPhrase,
    waterPhrase,
  ].filter(Boolean).join(" ");

  const detail = [accessPhrase, townPhrase, skiPhrase].filter(Boolean).join(" · ");

  return `${lead}. ${capitalize(detail)}. ${capitalize(cabinPhrase)}.`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function prosCons(p: Parcel): { pros: string[]; cons: string[] } {
  const e = p.enrichment;
  const s = p.scores;
  const pros: string[] = [];
  const cons: string[] = [];

  if (e.publicLandAdjacent) pros.push("Borders public land");
  if (e.forestCoverPct >= 70) pros.push(`${e.forestCoverPct}% forest cover`);
  if (e.waterMiles < 0.5 && e.waterFeature) pros.push(`${e.waterFeature} on or at edge of property`);
  if (s.privacy >= 75) pros.push("High privacy score");
  if (s.buildability >= 75) pros.push("Buildable terrain");
  if (e.nearestSkiMiles < 25) pros.push(`${Math.round(e.nearestSkiMiles)} mi to ${e.nearestSkiArea}`);
  if (e.aspect === "S" || e.aspect === "SE" || e.aspect === "SW") pros.push("South-facing aspect");
  if (e.elevationFt > 3500) pros.push(`${Math.round(e.elevationFt)} ft elevation — alpine feel`);

  if (e.slopeDeg > 22) cons.push(`Steep terrain (${e.slopeDeg.toFixed(0)}° avg slope)`);
  if (e.roadAccess === "Seasonal") cons.push("Seasonal access only");
  if (e.roadAccess === "Unimproved") cons.push("Unimproved access — may need road work");
  if (e.nearestTownMiles > 18) cons.push(`Far from town (${Math.round(e.nearestTownMiles)} mi)`);
  if (e.forestCoverPct < 20) cons.push("Mostly open — limited screening");
  if (s.buildability < 45) cons.push("Limited buildable area");
  if (e.aspect === "N") cons.push("North-facing — slower spring melt");

  return { pros: pros.slice(0, 5), cons: cons.slice(0, 4) };
}
