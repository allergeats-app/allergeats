-- =============================================================================
-- 006_rls_security_fixes.sql
--
-- Fixes flagged by Supabase security linter:
--
--   1. SECURITY DEFINER on dish_community_scores view  →  switch to SECURITY INVOKER
--      (views should enforce the querying user's RLS/permissions, not the creator's)
--
--   2. RLS disabled on public tables exposed to PostgREST:
--        restaurants, menu_items         (migration 004 enables RLS but may not have run)
--        item_sources, item_ingredients,
--        item_allergens, item_nutrition  (created outside migrations — public read, service write)
--        sync_runs                       (internal table — service role only)
--
-- All statements are idempotent (safe to re-run).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. dish_community_scores — switch from SECURITY DEFINER to SECURITY INVOKER
-- ---------------------------------------------------------------------------
-- PostgreSQL 15+: ALTER VIEW supports the security_invoker option.
-- This ensures the view respects the row-level policies of the *calling* user
-- rather than the view creator, which is the secure default.

alter view if exists public.dish_community_scores
  set (security_invoker = on);


-- ---------------------------------------------------------------------------
-- 2. restaurants  (public read, service role writes)
-- ---------------------------------------------------------------------------
alter table public.restaurants enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'restaurants'
      and policyname = 'Public read restaurants'
  ) then
    create policy "Public read restaurants"
      on public.restaurants for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'restaurants'
      and policyname = 'Service role manages restaurants'
  ) then
    create policy "Service role manages restaurants"
      on public.restaurants for all
      using     (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 3. menu_items  (public read, service role writes)
-- ---------------------------------------------------------------------------
alter table public.menu_items enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'menu_items'
      and policyname = 'Public read menu_items'
  ) then
    create policy "Public read menu_items"
      on public.menu_items for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'menu_items'
      and policyname = 'Service role manages menu_items'
  ) then
    create policy "Service role manages menu_items"
      on public.menu_items for all
      using     (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 4. item_sources  (public read, service role writes)
-- ---------------------------------------------------------------------------
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'item_sources'
  ) then
    execute 'alter table public.item_sources enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'item_sources'
        and policyname = 'Public read item_sources'
    ) then
      execute $p$
        create policy "Public read item_sources"
          on public.item_sources for select using (true)
      $p$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'item_sources'
        and policyname = 'Service role manages item_sources'
    ) then
      execute $p$
        create policy "Service role manages item_sources"
          on public.item_sources for all
          using     (auth.role() = 'service_role')
          with check (auth.role() = 'service_role')
      $p$;
    end if;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 5. item_ingredients  (public read, service role writes)
-- ---------------------------------------------------------------------------
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'item_ingredients'
  ) then
    execute 'alter table public.item_ingredients enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'item_ingredients'
        and policyname = 'Public read item_ingredients'
    ) then
      execute $p$
        create policy "Public read item_ingredients"
          on public.item_ingredients for select using (true)
      $p$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'item_ingredients'
        and policyname = 'Service role manages item_ingredients'
    ) then
      execute $p$
        create policy "Service role manages item_ingredients"
          on public.item_ingredients for all
          using     (auth.role() = 'service_role')
          with check (auth.role() = 'service_role')
      $p$;
    end if;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 6. item_allergens  (public read, service role writes)
-- ---------------------------------------------------------------------------
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'item_allergens'
  ) then
    execute 'alter table public.item_allergens enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'item_allergens'
        and policyname = 'Public read item_allergens'
    ) then
      execute $p$
        create policy "Public read item_allergens"
          on public.item_allergens for select using (true)
      $p$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'item_allergens'
        and policyname = 'Service role manages item_allergens'
    ) then
      execute $p$
        create policy "Service role manages item_allergens"
          on public.item_allergens for all
          using     (auth.role() = 'service_role')
          with check (auth.role() = 'service_role')
      $p$;
    end if;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 7. item_nutrition  (public read, service role writes)
-- ---------------------------------------------------------------------------
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'item_nutrition'
  ) then
    execute 'alter table public.item_nutrition enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'item_nutrition'
        and policyname = 'Public read item_nutrition'
    ) then
      execute $p$
        create policy "Public read item_nutrition"
          on public.item_nutrition for select using (true)
      $p$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'item_nutrition'
        and policyname = 'Service role manages item_nutrition'
    ) then
      execute $p$
        create policy "Service role manages item_nutrition"
          on public.item_nutrition for all
          using     (auth.role() = 'service_role')
          with check (auth.role() = 'service_role')
      $p$;
    end if;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 8. sync_runs  (service role only — internal/admin table)
-- ---------------------------------------------------------------------------
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'sync_runs'
  ) then
    execute 'alter table public.sync_runs enable row level security';

    -- No public read — sync_runs is an internal admin table.
    -- Only the service role (server-side code) can read or write it.
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_runs'
        and policyname = 'Service role manages sync_runs'
    ) then
      execute $p$
        create policy "Service role manages sync_runs"
          on public.sync_runs for all
          using     (auth.role() = 'service_role')
          with check (auth.role() = 'service_role')
      $p$;
    end if;
  end if;
end $$;
