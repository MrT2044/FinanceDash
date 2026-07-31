-- Bankkonten des Nutzers. Es wird bewusst nur eine maskierte IBAN gespeichert
-- (letzte 4 Stellen), damit ein DB-Leak keine vollständigen Kontodaten preisgibt.

create type public.bank_type as enum (
  'sparkasse',
  'dkb',
  'ing',
  'comdirect',
  'volksbank',
  'n26',
  'generic'
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  bank_type public.bank_type not null default 'generic',
  iban_masked text check (char_length(iban_masked) <= 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);
create unique index accounts_user_name_uniq on public.accounts (user_id, lower(name));

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();
