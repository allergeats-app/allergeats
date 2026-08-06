-- subscriptions: tracks Stripe subscription state per user
create table if not exists public.subscriptions (
  user_id               uuid references auth.users(id) on delete cascade primary key,
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  status                text not null default 'free',
  -- status values: 'free' | 'active' | 'past_due' | 'canceled' | 'trialing'
  price_id              text,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'subscriptions' and policyname = 'Users read own subscription'
  ) then
    create policy "Users read own subscription"
      on public.subscriptions
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- Service role (webhook) can upsert any row
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'subscriptions' and policyname = 'Service role manages subscriptions'
  ) then
    create policy "Service role manages subscriptions"
      on public.subscriptions
      for all
      using (auth.jwt()->>'role' = 'service_role');
  end if;
end $$;
