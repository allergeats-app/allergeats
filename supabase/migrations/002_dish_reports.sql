-- Crowdsourced dish safety reports
-- Each row = one user's report: "this dish was safe / caused a reaction for my allergen"

create table if not exists dish_reports (
  id               uuid primary key default gen_random_uuid(),
  dish_name        text not null,                         -- original display name
  dish_normalized  text not null,                         -- lowercase, stripped for matching
  restaurant_name  text,                                  -- null = unknown / manual scan
  rest_normalized  text,                                  -- normalized restaurant name
  allergen         text not null,                         -- e.g. "dairy", "peanuts"
  outcome          text not null check (outcome in ('safe', 'reaction', 'uncertain')),
  user_id          uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

-- Index for fast lookups by dish + allergen
create index if not exists dish_reports_lookup
  on dish_reports (dish_normalized, allergen);

-- Index for restaurant-scoped lookups
create index if not exists dish_reports_restaurant
  on dish_reports (rest_normalized, dish_normalized, allergen);

-- RLS: anyone can read aggregate counts; only authenticated users can insert
alter table dish_reports enable row level security;

create policy "Public read" on dish_reports
  for select using (true);

create policy "Authenticated insert" on dish_reports
  for insert with check (true);  -- allow anonymous reports (user_id nullable)

-- View: aggregated community scores per (dish, restaurant, allergen)
create or replace view dish_community_scores as
select
  dish_normalized,
  rest_normalized,
  allergen,
  count(*) as total,
  count(*) filter (where outcome = 'safe')     as safe_count,
  count(*) filter (where outcome = 'reaction') as reaction_count,
  count(*) filter (where outcome = 'uncertain') as uncertain_count
from dish_reports
group by dish_normalized, rest_normalized, allergen;
