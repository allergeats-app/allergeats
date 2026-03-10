-- =============================================================================
-- 004_menu_ingestion.sql
--
-- Menu ingestion persistence layer.
--
-- Tables created:
--   restaurants      — canonical restaurant records (anchor for all menu data)
--   menu_sources     — one record per raw source import (with hash dedup)
--   menu_versions    — one record per normalized menu snapshot (versioned)
--   menu_sections    — sections within a menu version
--   menu_items       — normalized items within a section/version
--
-- Design decisions:
--   - restaurants.id is TEXT to match existing in-code IDs (e.g. "mcdonalds")
--   - All menu tables use gen_random_uuid() for stable, opaque identifiers
--   - raw_snapshot_hash enables O(1) dedup on repeated imports
--   - menu_versions.checksum enables skip-if-unchanged on normalized content
--   - is_active partial unique index enforces one active version per restaurant
--   - Full-text index on normalized_text supports future allergen search queries
--   - source_signals stored as jsonb[] for later filtering/analytics
--   - Schema leaves room for: menu_item_analysis, validated_rules,
--     candidate_rules, restaurant_item_memory (all reference menu_items.id
--     or restaurants.id)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. restaurants
-- ---------------------------------------------------------------------------
-- Canonical restaurant records. Restaurant ID matches the in-app id used in
-- MOCK_RESTAURANTS and session storage. user_favorites.restaurant_id can be
-- made a FK here in a future migration once legacy data is reconciled.

create table if not exists public.restaurants (
  id          text        primary key,
  name        text        not null,
  cuisine     text,
  address     text,
  lat         numeric(9, 6),
  lng         numeric(9, 6),
  phone       text,
  website     text,
  places_id   text,                          -- Google Places place_id (optional)
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Update updated_at automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'restaurants_set_updated_at'
  ) then
    create trigger restaurants_set_updated_at
      before update on public.restaurants
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Indexes
create index if not exists idx_restaurants_name
  on public.restaurants (lower(name));

create index if not exists idx_restaurants_places_id
  on public.restaurants (places_id)
  where places_id is not null;

-- RLS
alter table public.restaurants enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'restaurants' and policyname = 'Public read restaurants'
  ) then
    create policy "Public read restaurants"
      on public.restaurants for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'restaurants' and policyname = 'Service role manages restaurants'
  ) then
    create policy "Service role manages restaurants"
      on public.restaurants for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. menu_sources
-- ---------------------------------------------------------------------------
-- One record per raw source import attempt.
-- raw_snapshot_hash is used to detect repeated identical imports (skip dedup).

create table if not exists public.menu_sources (
  id                  uuid        primary key default gen_random_uuid(),
  restaurant_id       text        not null references public.restaurants(id) on delete cascade,
  source_type         text        not null,
  source_url          text,
  source_label        text,
  source_confidence   text        not null default 'medium',
  imported_at         timestamptz not null default now(),
  last_seen_at        timestamptz not null default now(),
  raw_snapshot        text,                  -- original content, truncated at 20 KB
  raw_snapshot_hash   text,                  -- md5 of raw content for dedup
  import_status       text        not null default 'success',
  notes               text,

  constraint menu_sources_source_type_check
    check (source_type in (
      'official_api', 'aggregator_api', 'verified_dataset',
      'website_html', 'pdf', 'image', 'user_upload'
    )),
  constraint menu_sources_confidence_check
    check (source_confidence in ('high', 'medium', 'low')),
  constraint menu_sources_status_check
    check (import_status in ('success', 'partial', 'failed'))
);

create index if not exists idx_menu_sources_restaurant_id
  on public.menu_sources (restaurant_id);

create index if not exists idx_menu_sources_hash
  on public.menu_sources (restaurant_id, raw_snapshot_hash)
  where raw_snapshot_hash is not null;

create index if not exists idx_menu_sources_imported_at
  on public.menu_sources (imported_at desc);

create index if not exists idx_menu_sources_source_type
  on public.menu_sources (source_type);

-- RLS
alter table public.menu_sources enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'menu_sources' and policyname = 'Public read menu_sources'
  ) then
    create policy "Public read menu_sources"
      on public.menu_sources for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'menu_sources' and policyname = 'Service role manages menu_sources'
  ) then
    create policy "Service role manages menu_sources"
      on public.menu_sources for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. menu_versions
-- ---------------------------------------------------------------------------
-- One record per normalized menu snapshot. Multiple versions per restaurant.
-- Only one can be active at a time (enforced by unique partial index).
-- checksum enables skip-if-unchanged at the normalized content level.

create table if not exists public.menu_versions (
  id              uuid        primary key default gen_random_uuid(),
  restaurant_id   text        not null references public.restaurants(id) on delete cascade,
  menu_source_id  uuid        references public.menu_sources(id) on delete set null,
  version_number  integer     not null default 1,
  imported_at     timestamptz not null default now(),
  is_active       boolean     not null default false,
  checksum        text,                      -- md5 of sorted normalized_text values
  section_count   integer     not null default 0,
  item_count      integer     not null default 0,

  constraint menu_versions_version_number_check check (version_number >= 1),
  unique (restaurant_id, version_number)
);

-- At most one active version per restaurant
create unique index if not exists idx_menu_versions_one_active
  on public.menu_versions (restaurant_id)
  where is_active = true;

create index if not exists idx_menu_versions_restaurant_id
  on public.menu_versions (restaurant_id);

create index if not exists idx_menu_versions_checksum
  on public.menu_versions (checksum)
  where checksum is not null;

create index if not exists idx_menu_versions_imported_at
  on public.menu_versions (imported_at desc);

-- RLS
alter table public.menu_versions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'menu_versions' and policyname = 'Public read menu_versions'
  ) then
    create policy "Public read menu_versions"
      on public.menu_versions for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'menu_versions' and policyname = 'Service role manages menu_versions'
  ) then
    create policy "Service role manages menu_versions"
      on public.menu_versions for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. menu_sections
-- ---------------------------------------------------------------------------

create table if not exists public.menu_sections (
  id               uuid    primary key default gen_random_uuid(),
  menu_version_id  uuid    not null references public.menu_versions(id) on delete cascade,
  section_name     text    not null,
  sort_order       integer not null default 0
);

create index if not exists idx_menu_sections_version_id
  on public.menu_sections (menu_version_id);

-- RLS
alter table public.menu_sections enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'menu_sections' and policyname = 'Public read menu_sections'
  ) then
    create policy "Public read menu_sections"
      on public.menu_sections for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'menu_sections' and policyname = 'Service role manages menu_sections'
  ) then
    create policy "Service role manages menu_sections"
      on public.menu_sections for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. menu_items
-- ---------------------------------------------------------------------------
-- Normalized items within a section/version.
-- source_signals is jsonb to store the array of human-readable signal strings
-- without requiring a separate table.
-- normalized_text gets a GIN full-text index for future allergen search.

create table if not exists public.menu_items (
  id                uuid        primary key default gen_random_uuid(),
  menu_version_id   uuid        not null references public.menu_versions(id) on delete cascade,
  menu_section_id   uuid        references public.menu_sections(id) on delete set null,
  restaurant_id     text        not null references public.restaurants(id) on delete cascade,
  external_item_id  text,                   -- source-native ID (e.g. Nutritionix nix_item_id)
  item_name         text        not null,
  description       text,
  price             text,
  raw_text          text        not null,
  normalized_text   text        not null,
  source_confidence text        not null default 'medium',
  source_signals    jsonb,                  -- string[] of signal labels
  checksum          text,                   -- md5(item_name || '|' || coalesce(description,''))
  sort_order        integer     not null default 0,
  created_at        timestamptz not null default now(),

  constraint menu_items_confidence_check
    check (source_confidence in ('high', 'medium', 'low'))
);

create index if not exists idx_menu_items_version_id
  on public.menu_items (menu_version_id);

create index if not exists idx_menu_items_section_id
  on public.menu_items (menu_section_id);

create index if not exists idx_menu_items_restaurant_id
  on public.menu_items (restaurant_id);

create index if not exists idx_menu_items_checksum
  on public.menu_items (checksum)
  where checksum is not null;

-- Full-text search on normalized menu item content
create index if not exists idx_menu_items_fts
  on public.menu_items
  using gin (to_tsvector('english', normalized_text));

-- RLS
alter table public.menu_items enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'menu_items' and policyname = 'Public read menu_items'
  ) then
    create policy "Public read menu_items"
      on public.menu_items for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'menu_items' and policyname = 'Service role manages menu_items'
  ) then
    create policy "Service role manages menu_items"
      on public.menu_items for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Convenience view: active_menus
-- ---------------------------------------------------------------------------
-- Joins the active menu version with its source for easy querying.

create or replace view public.active_menus as
  select
    r.id            as restaurant_id,
    r.name          as restaurant_name,
    r.cuisine,
    mv.id           as menu_version_id,
    mv.version_number,
    mv.imported_at  as version_imported_at,
    mv.item_count,
    mv.section_count,
    mv.checksum     as version_checksum,
    ms.source_type,
    ms.source_url,
    ms.source_confidence,
    ms.imported_at  as source_imported_at,
    ms.last_seen_at as source_last_seen_at
  from public.restaurants r
  join public.menu_versions mv
    on mv.restaurant_id = r.id and mv.is_active = true
  left join public.menu_sources ms
    on ms.id = mv.menu_source_id;
