// Natural-language → ParcelFilter. Always runs deterministic parser.
// If OPENAI_API_KEY is set, refines the filter with a model call (kept tiny).

import { NextResponse } from "next/server";
import { parseNL } from "@/lib/nl-parse";
import type { ParcelFilter } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { query } = (await req.json().catch(() => ({}))) as { query?: string };
  if (!query) return NextResponse.json({ error: "missing query" }, { status: 400 });

  const base = parseNL(query);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ filter: base, source: "deterministic" });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You convert a land-search query into a JSON filter for a North Idaho parcel database. Return ONLY a JSON object with any subset of these keys: acresMin (number), acresMax (number), county ('Bonner'|'Boundary'), publicLandAdjacent (boolean), waterMaxMiles (number), skiMaxMiles (number), townMaxMiles (number), forestMinPct (0-100), slopeMaxDeg (0-60), minOverall (0-100). Omit keys you are unsure about. Do not invent values.",
          },
          { role: "user", content: query },
        ],
      }),
    });
    if (!res.ok) throw new Error(`openai ${res.status}`);
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("empty");
    const aiFilter = JSON.parse(raw) as ParcelFilter;
    const merged: ParcelFilter = { ...base, ...aiFilter, query };
    return NextResponse.json({ filter: merged, source: "ai" });
  } catch {
    return NextResponse.json({ filter: base, source: "deterministic" });
  }
}
