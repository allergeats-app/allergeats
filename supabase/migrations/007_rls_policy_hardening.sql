-- =============================================================================
-- 007_rls_policy_hardening.sql
--
-- Fixes remaining Supabase security linter warnings:
--
--   1. function_search_path_mutable
--        delete_expired_restaurant_images — add SET search_path = public
--
--   2. rls_policy_always_true
--        dish_reports          "Authenticated insert"  WITH CHECK (true)
--                              → enforce user_id must match auth.uid()
--                                (anonymous: user_id must be null)
--        restaurant_cache      "service write"         USING/CHECK (true)
--                              → scope to service_role
--        restaurant_images     "service_role_all"      USING/CHECK (true)
--                              → scope to service_role
--
--   3. auth_leaked_password_protection (WARN)
--        Cannot be fixed via SQL — enable in Supabase dashboard:
--        Authentication → Settings → Password Security →
--        "Enable Leaked Password Protection"
--
-- All statements are idempotent (safe to re-run).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Fix mutable search_path on delete_expired_restaurant_images
-- ---------------------------------------------------------------------------
-- Without SET search_path, a malicious user could shadow built-ins or the
-- target table by manipulating the session search_path before calling this.
-- Adding SET search_path = public pins it to a safe, known location.

create or replace function public.delete_expired_restaurant_images()
returns void
language sql
security invoker
set search_path = public
as $$
  delete from public.restaurant_images where expires_at < now();
$$;


-- ---------------------------------------------------------------------------
-- 2. Tighten dish_reports INSERT policy
-- ---------------------------------------------------------------------------
-- Old: WITH CHECK (true) — allows anyone to insert any row with any user_id.
-- New: anonymous callers must supply user_id = null;
--      authenticated callers must supply user_id = their own auth.uid().
-- This prevents authenticated users from forging reports under another uid.

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dish_reports'
      and policyname = 'Authenticated insert'
  ) then
    drop policy "Authenticated insert" on public.dish_reports;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dish_reports'
      and policyname = 'Insert dish report'
  ) then
    create policy "Insert dish report"
      on public.dish_reports for insert
      with check (
        -- Authenticated user: user_id must be null or match their own uid
        (auth.uid() is not null and (user_id is null or user_id = auth.uid()))
        or
        -- Anonymous caller: user_id must be null
        (auth.uid() is null and user_id is null)
      );
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 3. Tighten restaurant_cache "service write" policy
-- ---------------------------------------------------------------------------
-- Old: USING (true) WITH CHECK (true) for ALL — anyone can write.
-- New: only the service role (server-side API routes) can write.
-- Public SELECT is handled by a separate read-only policy.

do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'restaurant_cache'
  ) then
    if exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'restaurant_cache'
        and policyname = 'service write'
    ) then
      execute 'drop policy "service write" on public.restaurant_cache';
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'restaurant_cache'
        and policyname = 'Service role manages restaurant_cache'
    ) then
      execute $p$
        create policy "Service role manages restaurant_cache"
          on public.restaurant_cache for all
          using     (auth.role() = 'service_role')
          with check (auth.role() = 'service_role')
      $p$;
    end if;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 4. Tighten restaurant_images "service_role_all" policy
-- ---------------------------------------------------------------------------
-- Old: USING (true) WITH CHECK (true) for ALL — anyone can write.
-- New: only the service role can insert/update/delete.
-- The existing "public_read" SELECT policy is unchanged and stays in place.

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'restaurant_images'
      and policyname = 'service_role_all'
  ) then
    drop policy "service_role_all" on public.restaurant_images;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'restaurant_images'
      and policyname = 'Service role manages restaurant_images'
  ) then
    create policy "Service role manages restaurant_images"
      on public.restaurant_images for all
      using     (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- NOTE: auth_leaked_password_protection
-- ---------------------------------------------------------------------------
-- This cannot be fixed via SQL. Enable it in the Supabase dashboard:
--   Authentication → Settings → Password Security
--   → turn on "Enable Leaked Password Protection"
--
-- This checks new/changed passwords against HaveIBeenPwned.org and blocks
-- known compromised passwords at sign-up / password-change time.
-- ---------------------------------------------------------------------------
