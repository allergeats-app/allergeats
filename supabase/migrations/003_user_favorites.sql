-- user_favorites: stores saved/bookmarked restaurants per user
create table if not exists public.user_favorites (
  user_id       uuid references auth.users(id) on delete cascade not null,
  restaurant_id text not null,
  created_at    timestamptz default now(),
  primary key (user_id, restaurant_id)
);

-- Only the owner can read/write their own favorites
alter table public.user_favorites enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_favorites' and policyname = 'Users manage own favorites'
  ) then
    create policy "Users manage own favorites"
      on public.user_favorites
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
