-- safety_acceptances: records when a logged-in user accepted the Terms of Service
-- and safety acknowledgement. A row per user per (terms_version, safety_notice_version) pair.
-- Inserting a duplicate (same user + same versions) is silently ignored via ON CONFLICT.

create table if not exists public.safety_acceptances (
  id                    uuid        default gen_random_uuid() primary key,
  user_id               uuid        not null references auth.users(id) on delete cascade,
  accepted_at           timestamptz not null default now(),
  terms_version         text        not null,
  safety_notice_version text        not null,
  -- optional metadata for audit purposes
  user_agent            text,
  constraint safety_acceptances_user_versions_unique
    unique (user_id, terms_version, safety_notice_version)
);

alter table public.safety_acceptances enable row level security;

-- Users can read their own acceptance records
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'safety_acceptances' and policyname = 'Users read own acceptances'
  ) then
    create policy "Users read own acceptances"
      on public.safety_acceptances
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- Users can insert their own acceptance records
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'safety_acceptances' and policyname = 'Users insert own acceptances'
  ) then
    create policy "Users insert own acceptances"
      on public.safety_acceptances
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- No update or delete policies — acceptance records are immutable by design

create index if not exists safety_acceptances_user_id_idx
  on public.safety_acceptances(user_id);

create index if not exists safety_acceptances_versions_idx
  on public.safety_acceptances(terms_version, safety_notice_version);
