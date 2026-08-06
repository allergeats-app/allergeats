-- family_profiles: up to 5 allergen profiles per user (Pro feature)
create table if not exists public.family_profiles (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  emoji       text not null default '🧑',
  allergens   jsonb not null default '[]',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.family_profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'family_profiles' and policyname = 'Users manage own family profiles'
  ) then
    create policy "Users manage own family profiles"
      on public.family_profiles
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists family_profiles_user_id_idx on public.family_profiles(user_id);
