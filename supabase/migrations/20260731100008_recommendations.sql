-- Persistierte Insights/Empfehlungen. Bewusst gespeichert statt nur live berechnet,
-- damit Nutzer sie ausblenden können und die Historie nachvollziehbar bleibt.

create type public.insight_type as enum (
  'category_increase',
  'savings_potential',
  'subscription_detected',
  'unusual_spending',
  'savings_rate'
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.insight_type not null,
  fingerprint text not null check (char_length(fingerprint) <= 200),
  period_start date not null,
  period_end date not null,
  title text not null check (char_length(title) <= 200),
  description text not null check (char_length(description) <= 1000),
  payload jsonb not null default '{}'::jsonb,
  severity text not null default 'info' check (severity in ('info', 'warning')),
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint recommendations_period_valid check (period_end >= period_start)
);

-- Verhindert doppelte Insights beim wiederholten Neuberechnen.
create unique index recommendations_user_fingerprint_uniq
  on public.recommendations (user_id, fingerprint);
create index recommendations_user_created_idx
  on public.recommendations (user_id, dismissed, created_at desc);
