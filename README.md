# something

An AI-powered land discovery platform for **North Idaho** — Bonner and Boundary counties.

> Find land nobody else noticed.

This is the low-cost MVP. It runs free out of the box on built-in curated mock
parcels and degrades gracefully when external services aren't configured. Add
Supabase + OpenAI later as the catalog and traffic grow.

---

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind v4**
- **MapLibre GL** + **OpenStreetMap / OpenTopoMap / Esri imagery** tiles (no Mapbox key)
- **Supabase Postgres + PostGIS** (optional — local mock data is the default)
- **OpenAI** for natural-language search and parcel summaries (optional — deterministic fallback always works)
- Deploys to **Vercel**

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

That's it. The app boots on ~50 hand-curated parcels in Bonner & Boundary counties.

### Optional — connect Supabase

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # only needed for the import script
```

Then run `db/schema.sql` in the Supabase SQL editor (creates the `parcels` and
`scouts` tables, enables PostGIS, sets up indexes).

### Optional — enable AI

```
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini   # default
```

The app uses model calls in two places:
- **NL search** (`/api/parse`) — converts a query like “private 20+ acres bordering National Forest” into a structured filter. Falls back to a deterministic regex parser.
- **Parcel summaries** (`/api/summary`) — refines a 2–3 sentence description per parcel. Falls back to a deterministic generator. Each parcel ships with a baked-in summary so the drawer is never empty.

---

## Importing real parcels

```bash
# 1. Download the county shapefile (free public GIS):
#    Bonner:   https://www.bonnercountyid.gov/departments/gis
#    Boundary: https://www.boundarycountyid.org/departments/gis
#    (or via Idaho INSIDE Idaho: https://insideidaho.org)

# 2. Apply the schema (Supabase SQL editor or psql):
psql "$SUPABASE_DB_URL" -f db/schema.sql

# 3. Run the importer for each county shapefile:
npx tsx scripts/import-shapefiles.ts --file ./data/bonner_parcels.shp --county Bonner
npx tsx scripts/import-shapefiles.ts --file ./data/boundary_parcels.shp --county Boundary
```

The importer computes scores via `lib/scoring.ts` and writes a deterministic
summary per parcel into the `ai_summary` column. Production builds add a
follow-up enrichment job to populate slope, forest cover, public-land
adjacency, etc., from USGS DEM, NLCD canopy, and PAD-US.

> Keep imports curated. Don't bulk-load every county parcel — it kills the “only
> the good stuff” feel of the product. Filter to vacant rural / forest land,
> ≥ 5 acres, before importing.

---

## Project layout

```
app/
  page.tsx               landing
  discover/page.tsx      map + NL search + drawer
  scouts/page.tsx        saved searches
  api/parse/route.ts     NL → filter (AI optional)
  api/summary/route.ts   parcel summary (AI optional)
components/
  parcel-map.tsx         MapLibre, parcel polygons, score-colored fills
  parcel-drawer.tsx      Radix Dialog drawer with scores + pros/cons
  search-bar.tsx
  filter-panel.tsx
lib/
  types.ts
  mock-data.ts           ~50 curated North Idaho parcels
  scoring.ts             privacy/beauty/buildability/recreation/STR/overall
  nl-parse.ts            deterministic NL → ParcelFilter
  ai-summary.ts          deterministic per-parcel summary + pros/cons
  filter.ts              applyFilter()
  geo.ts                 centroid → polygon helper
  map-styles.ts          MapLibre styles for topo / dark / satellite
  scouts-store.ts        localStorage persistence (Supabase optional)
  supabase.ts            optional client
db/
  schema.sql             PostGIS schema for parcels + scouts
scripts/
  import-shapefiles.ts   shapefile → Postgres importer
```

---

## Cost target — under **$100/month**

| Service              | Tier              | Cost                                    |
|----------------------|-------------------|-----------------------------------------|
| Vercel hosting       | Hobby / Pro       | $0 / $20                                |
| Supabase Postgres    | Free → small Pro  | $0 / $25                                |
| Map tiles (OSM/CARTO/Esri) | Public        | $0 (respect attribution & limits)        |
| OpenAI summaries     | gpt-4o-mini       | ~$0.15 / 1K parcel summaries (cached)    |
| **Estimated total**  | starter           | **$0 – $50 / month**                    |

Notes:
- AI calls are per-parcel and per-search and small. Cache summaries in the `ai_summary` column so each parcel costs at most one call.
- Don't over-import parcels; cost grows with catalog size only if you re-summarize.
- Stay on free tile sources during MVP. If traffic grows, switch to MapTiler / Stadia (small monthly fee) or self-host a Protomaps PMTiles file on R2/B2.

---

## What's intentionally NOT in the MVP

- Nationwide ingestion
- MLS / Zillow / LandWatch / Regrid / ATTOM integrations
- Outreach automation, mass mail, contact pipelines
- Enterprise auth / multi-tenant / billing
- Heavy computer-vision parcel scoring

Stay small. Make the catalog feel curated and magical.

---

## Deploy

```bash
# Vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY              # optional
vercel deploy --prod
```

The app is fully functional with **no env vars set** — Vercel will deploy and
show the curated mock catalog. Connect Supabase and OpenAI later.

---

## Data attribution

- OpenStreetMap contributors © OpenStreetMap (ODbL)
- OpenTopoMap (CC-BY-SA)
- CARTO basemaps © CARTO
- Esri World Imagery (Esri, Maxar, Earthstar Geographics, USDA, USGS)
- Bonner & Boundary County GIS (public records)
- USGS 3DEP elevation / NLCD canopy / PAD-US public lands / FEMA NFHL
