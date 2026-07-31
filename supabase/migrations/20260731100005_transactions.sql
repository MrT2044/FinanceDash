-- Transaktionen: der Kern der Anwendung.
-- amount < 0 = Ausgabe, amount > 0 = Einnahme (einheitliche Vorzeichenkonvention
-- unabhängig davon, wie die jeweilige Bank exportiert).

create type public.category_source as enum ('rule', 'ai', 'manual', 'uncategorized');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  import_batch_id uuid references public.import_batches (id) on delete set null,
  booking_date date not null,
  value_date date,
  amount numeric(14, 2) not null check (amount <> 0),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  purpose text check (char_length(purpose) <= 2000),
  counterparty_name text check (char_length(counterparty_name) <= 255),
  counterparty_iban text check (char_length(counterparty_iban) <= 34),
  category_id uuid references public.categories (id) on delete set null,
  category_source public.category_source not null default 'uncategorized',
  category_confidence numeric(3, 2) check (category_confidence between 0 and 1),
  notes text check (char_length(notes) <= 1000),
  dedupe_hash text not null check (char_length(dedupe_hash) = 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Duplikaterkennung als harte DB-Garantie: derselbe Umsatz kann pro Nutzer
-- nicht zweimal importiert werden, auch nicht bei parallelen Uploads.
create unique index transactions_user_dedupe_uniq
  on public.transactions (user_id, dedupe_hash);

create index transactions_user_date_idx
  on public.transactions (user_id, booking_date desc);
create index transactions_user_category_idx
  on public.transactions (user_id, category_id);
create index transactions_account_idx on public.transactions (account_id);
create index transactions_batch_idx on public.transactions (import_batch_id);

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();
