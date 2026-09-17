-- Something — North Idaho MVP schema
-- Run on Supabase Postgres (with PostGIS) or any Postgres 14+ with PostGIS.

create extension if not exists postgis;

-- Parcels table mirrors lib/types.ts:Parcel
create table if not exists parcels (
  id              text primary key,
  apn             text not null,
  county          text not null check (county in ('Bonner','Boundary')),
  state           text not null default 'ID',
  acres           numeric(10,2) not null,
  centroid_lat    double precision not null,
  centroid_lng    double precision not null,
  geom            geometry(Polygon, 4326) not null,

  owner_name      text,
  owner_city      text,
  owner_state     text,
  land_use        text,
  zoning          text,

  -- enrichment
  slope_deg               numeric(5,2),
  forest_cover_pct        smallint,
  nearest_town            text,
  nearest_town_miles      numeric(6,2),
  nearest_ski_area        text,
  nearest_ski_miles       numeric(6,2),
  nearest_airport         text,
  nearest_airport_miles   numeric(6,2),
  public_land_adjacent    boolean,
  public_land_neighbor_mi numeric(6,2),
  water_feature           text,
  water_miles             numeric(6,2),
  road_access             text check (road_access in ('Paved','Gravel','Seasonal','Unimproved')),
  elevation_ft            integer,
  aspect                  text check (aspect in ('N','NE','E','SE','S','SW','W','NW','Flat')),

  -- computed scores (recompute via lib/scoring.ts on import)
  score_privacy        smallint,
  score_beauty         smallint,
  score_buildability   smallint,
  score_recreation     smallint,
  score_str            smallint,
  score_overall        smallint,

  ai_summary           text,
  inserted_at          timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists parcels_geom_gix on parcels using gist (geom);
create index if not exists parcels_county_idx on parcels (county);
create index if not exists parcels_overall_idx on parcels (score_overall desc);
create index if not exists parcels_acres_idx on parcels (acres);

-- Saved scouts (optional; the MVP also supports localStorage-only mode)
create table if not exists scouts (
  id          text primary key,
  user_id     text,                 -- nullable until auth is added
  name        text not null,
  filter      jsonb not null,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists scouts_user_idx on scouts (user_id);

-- Enable Row Level Security so production can scope scouts to a user
alter table scouts enable row level security;
-- Permissive default for the MVP; tighten when auth lands
create policy if not exists scouts_anon_all on scouts for all using (true) with check (true);
