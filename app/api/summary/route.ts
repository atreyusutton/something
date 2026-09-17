// AI summary endpoint. Uses OpenAI if OPENAI_API_KEY is set; otherwise falls back
// to the deterministic generator so the app keeps working free of charge.

import { NextResponse } from "next/server";
import { getParcelById } from "@/lib/mock-data";
import { deterministicSummary } from "@/lib/ai-summary";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const parcel = getParcelById(id);
  if (!parcel) return NextResponse.json({ error: "not found" }, { status: 404 });

  const fallback = deterministicSummary(parcel);
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ summary: fallback, source: "deterministic" });
  }

  try {
    const prompt = buildPrompt(parcel, fallback);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content:
              "You write short (2–3 sentence) evocative descriptions of rural land parcels for a thoughtful land-discovery app. Be specific, concrete, and honest about trade-offs. Never invent facts. Never mention price.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`openai ${res.status}`);
    const json = await res.json();
    const summary = json?.choices?.[0]?.message?.content?.trim();
    if (!summary) throw new Error("empty completion");
    return NextResponse.json({ summary, source: "ai" });
  } catch {
    return NextResponse.json({ summary: fallback, source: "deterministic" });
  }
}

function buildPrompt(p: ReturnType<typeof getParcelById>, fallback: string): string {
  if (!p) return "";
  const e = p.enrichment;
  const s = p.scores;
  return [
    `County: ${p.county}, ID. Acres: ${p.acres}. Elev ${e.elevationFt} ft, ${e.aspect}-facing, slope ${e.slopeDeg}°.`,
    `Forest cover ${e.forestCoverPct}%. Road: ${e.roadAccess}.`,
    e.publicLandAdjacent ? "Adjacent to public land." : `Public land ${e.publicLandNeighborMiles ?? "?"} mi away.`,
    e.waterFeature ? `Water: ${e.waterFeature} at ${e.waterMiles} mi.` : "",
    `${e.nearestTown} ${e.nearestTownMiles} mi · ${e.nearestSkiArea} ${e.nearestSkiMiles} mi.`,
    `Scores — privacy ${s.privacy}, beauty ${s.beauty}, buildability ${s.buildability}, recreation ${s.recreation}, str ${s.strPotential}.`,
    `Existing draft: "${fallback}"`,
    `Write a tighter 2–3 sentence version. No price. No invented facts.`,
  ].filter(Boolean).join(" ");
}
