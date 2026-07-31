-- Kategorisierungsregeln: System-Defaults (user_id IS NULL) und gelernte
-- Regeln pro Nutzer, die bei manueller Korrektur automatisch entstehen.

create type public.rule_match_type as enum (
  'keyword',
  'merchant_exact',
  'merchant_contains',
  'iban'
);

create table public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  match_type public.rule_match_type not null,
  match_value text not null check (char_length(match_value) between 2 and 255),
  priority integer not null default 0,
  hit_count integer not null default 0,
  source text not null default 'learned' check (source in ('system', 'learned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_rules_system_has_no_owner check (
    (source = 'system' and user_id is null) or (source = 'learned' and user_id is not null)
  )
);

-- Match-Werte werden normalisiert (lowercase) gespeichert, daher hier kein lower().
create unique index category_rules_system_uniq
  on public.category_rules (match_type, match_value) where user_id is null;
create unique index category_rules_user_uniq
  on public.category_rules (user_id, match_type, match_value) where user_id is not null;
create index category_rules_lookup_idx
  on public.category_rules (user_id, match_type, match_value);

create trigger category_rules_set_updated_at
  before update on public.category_rules
  for each row execute function public.set_updated_at();
