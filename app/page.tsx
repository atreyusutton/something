import Link from "next/link";
import { getParcels } from "@/lib/mock-data";

export default function Home() {
  const parcels = getParcels();
  const total = parcels.length;
  const totalAcres = Math.round(parcels.reduce((s, p) => s + p.acres, 0));
  const publicAdj = parcels.filter((p) => p.enrichment.publicLandAdjacent).length;
  const wooded = parcels.filter((p) => p.enrichment.forestCoverPct >= 70).length;

  return (
    <div className="topo-bg">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1 text-xs text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Bonner & Boundary counties · curated · AI-scored
            </div>
            <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.02]">
              Find land
              <br />
              <span className="text-primary">nobody else noticed.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              An AI-powered land discovery platform for North Idaho. Scout beautiful, buildable
              parcels by terrain, lifestyle, water, and proximity to the wild.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/discover"
                className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Open the map
              </Link>
              <Link
                href="/scouts"
                className="px-5 py-3 rounded-md border border-border bg-panel hover:bg-muted transition"
              >
                Save a scout
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
              <Stat label="Curated parcels" value={total.toString()} />
              <Stat label="Total acres" value={totalAcres.toLocaleString()} />
              <Stat label="Touch public land" value={publicAdj.toString()} accent />
              <Stat label="Heavily wooded" value={wooded.toString()} />
            </div>
          </div>
        </div>
      </section>

      {/* Capability cards */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-5 py-20">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-8">
            What something does
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feature
              title="Natural-language land search"
              body="Describe what you want — “5–20 wooded acres near skiing,” “private mountain land bordering National Forest,” “buildable creek parcel near Sandpoint.” The map answers."
            />
            <Feature
              title="Parcel scoring you can trust"
              body="Privacy, beauty, buildability, recreation, and STR potential — computed from public GIS, slope, forest cover, water, public-land adjacency, and access."
            />
            <Feature
              title="AI summaries with pros and cons"
              body="One paragraph per parcel that reads like a friend who hiked it. Plus the trade-offs — steep slope, seasonal access, north-facing — surfaced honestly."
            />
            <Feature
              title="Saved scouts"
              body="Save a search and rerun it later. The scout watches as new parcels enter the curated set."
            />
            <Feature
              title="Free, public GIS data"
              body="Built on Bonner & Boundary county shapefiles, OSM, USGS elevation, FEMA, PAD-US, and USDA soils. No expensive nationwide APIs."
            />
            <Feature
              title="Curated, not massive"
              body="Hundreds of parcels — not millions. Quality over volume. Every parcel hand-checked before it lands on the map."
            />
          </div>
        </div>
      </section>

      {/* Footer-ish CTA */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-5 py-20 text-center">
          <p className="text-2xl sm:text-3xl font-medium tracking-tight max-w-2xl mx-auto">
            The best land doesn&apos;t announce itself.
          </p>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Open the map. Search by feel. Save what calls you back.
          </p>
          <Link
            href="/discover"
            className="inline-block mt-8 px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Open the map
          </Link>
        </div>
      </section>

      <footer className="border-t border-border text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-5 py-6 flex flex-wrap items-center justify-between gap-3">
          <div>© something — North Idaho land discovery.</div>
          <div className="text-muted-foreground/80">
            Public GIS · OpenStreetMap · USGS · FEMA · PAD-US · USDA
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${accent ? "bg-accent" : "bg-primary"}`} />
        <div className="text-2xl sm:text-3xl font-semibold tabular-nums">{value}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-5 hover:border-primary/40 transition">
      <h3 className="font-medium leading-snug">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{body}</p>
    </div>
  );
}
