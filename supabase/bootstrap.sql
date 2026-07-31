-- FinanceDash: vollständiges Schema (Bootstrap)
--
-- Zum Einspielen über den Supabase SQL-Editor. Die Datei ist wiederholbar:
-- Sie räumt zuerst alle FinanceDash-Objekte ab und legt sie danach neu an.
-- Ein abgebrochener Lauf lässt sich dadurch einfach erneut starten.
--
-- ACHTUNG: Der Aufräum-Block löscht vorhandene FinanceDash-Daten
-- (Konten, Buchungen, Kategorien). Bei einer frischen Einrichtung ist das
-- unkritisch. Registrierte Benutzer in auth.users bleiben erhalten — deren
-- Profile werden weiter unten neu angelegt.
--
-- Wer die Supabase-CLI nutzt, braucht diese Datei nicht: dort genügt
--   supabase db push

-- ============================================================
-- Aufräumen (macht die Datei wiederholbar)
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.security_events  cascade;
drop table if exists public.recommendations  cascade;
drop table if exists public.budgets          cascade;
drop table if exists public.category_rules   cascade;
drop table if exists public.transactions     cascade;
drop table if exists public.import_batches   cascade;
drop table if exists public.categories       cascade;
drop table if exists public.accounts         cascade;
drop table if exists public.profiles         cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at()  cascade;

drop type if exists public.insight_type      cascade;
drop type if exists public.rule_match_type   cascade;
drop type if exists public.category_source   cascade;
drop type if exists public.bank_type         cascade;

-- ============================================================
-- 20260731100001_init_profiles.sql
-- ============================================================
-- Profile: 1:1-Erweiterung zu auth.users mit App-spezifischen Einstellungen.
-- Es werden bewusst keine überflüssigen personenbezogenen Daten gespeichert (DSGVO-Datenminimierung).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  locale text not null default 'de-DE',
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App-Profil pro Benutzer, 1:1 zu auth.users.';

-- Automatisches Anlegen des Profils bei Registrierung.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generischer updated_at-Trigger, wird von mehreren Tabellen genutzt.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- 20260731100002_accounts.sql
-- ============================================================
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

-- ============================================================
-- 20260731100003_categories.sql
-- ============================================================
-- Kategorien: System-Defaults (user_id IS NULL, für alle sichtbar) und
-- eigene Kategorien pro Nutzer (user_id = auth.uid()).

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 60),
  icon text not null default 'circle',
  color text not null default '#64748b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  kind text not null default 'expense' check (kind in ('expense', 'income', 'transfer')),
  is_system boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- System-Kategorien haben nie einen Besitzer, Nutzer-Kategorien immer.
  constraint categories_system_has_no_owner check (
    (is_system and user_id is null) or (not is_system and user_id is not null)
  )
);

create unique index categories_system_slug_uniq
  on public.categories (slug) where user_id is null;
create unique index categories_user_slug_uniq
  on public.categories (user_id, slug) where user_id is not null;
create index categories_user_id_idx on public.categories (user_id);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ============================================================
-- 20260731100004_import_batches.sql
-- ============================================================
-- Import-Vorgänge: jeder CSV-Upload wird als Batch protokolliert, damit
-- Importe nachvollziehbar und im Fehlerfall rückverfolgbar sind.

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete cascade,
  filename text not null check (char_length(filename) <= 255),
  detected_format public.bank_type not null default 'generic',
  status text not null default 'pending' check (status in ('pending', 'committed', 'failed')),
  row_count integer not null default 0,
  imported_count integer not null default 0,
  duplicate_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create index import_batches_user_id_idx on public.import_batches (user_id, created_at desc);

-- ============================================================
-- 20260731100005_transactions.sql
-- ============================================================
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

-- ============================================================
-- 20260731100006_category_rules.sql
-- ============================================================
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

-- ============================================================
-- 20260731100007_budgets.sql
-- ============================================================
-- Budgets: im MVP noch nicht in der UI aktiv, das Schema ist bereits angelegt,
-- damit die Budgetplanung später ohne Migration von Bestandsdaten ergänzt werden kann.

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  monthly_limit numeric(14, 2) not null check (monthly_limit > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index budgets_user_category_uniq on public.budgets (user_id, category_id);

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- ============================================================
-- 20260731100008_recommendations.sql
-- ============================================================
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

-- ============================================================
-- 20260731100009_security_events.sql
-- ============================================================
-- Audit-Log sicherheitsrelevanter Ereignisse.
-- IP-Adressen werden nur als Hash gespeichert (DSGVO-Datenminimierung),
-- Transaktionsinhalte werden hier niemals protokolliert.

create table public.security_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null check (char_length(event_type) <= 60),
  ip_hash text check (char_length(ip_hash) = 64),
  user_agent text check (char_length(user_agent) <= 300),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index security_events_user_idx on public.security_events (user_id, created_at desc);
create index security_events_type_idx on public.security_events (event_type, created_at desc);

-- ============================================================
-- 20260731100010_rls_policies.sql
-- ============================================================
-- Row Level Security für alle Tabellen.
-- Zentral in einer Datei, damit die Zugriffsregeln an einer Stelle auditierbar sind.
--
-- Grundprinzip: Ein Nutzer sieht und ändert ausschließlich Zeilen mit
-- user_id = auth.uid(). Systemweite Stammdaten (Kategorien, Default-Regeln)
-- sind lesbar, aber für Nutzer nicht schreibbar.

alter table public.profiles          enable row level security;
alter table public.accounts          enable row level security;
alter table public.categories        enable row level security;
alter table public.import_batches    enable row level security;
alter table public.transactions      enable row level security;
alter table public.category_rules    enable row level security;
alter table public.budgets           enable row level security;
alter table public.recommendations   enable row level security;
alter table public.security_events   enable row level security;

-- ---------------------------------------------------------------- profiles
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- INSERT erfolgt ausschließlich über den handle_new_user()-Trigger,
-- DELETE über das Löschen des auth.users-Eintrags (Cascade).

-- ---------------------------------------------------------------- accounts
create policy "accounts_select_own" on public.accounts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "accounts_insert_own" on public.accounts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "accounts_update_own" on public.accounts
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "accounts_delete_own" on public.accounts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- -------------------------------------------------------------- categories
-- System-Kategorien (user_id IS NULL) sind für alle lesbar, aber nicht änderbar.
create policy "categories_select_own_or_system" on public.categories
  for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);
create policy "categories_insert_own" on public.categories
  for insert to authenticated
  with check ((select auth.uid()) = user_id and is_system = false);
create policy "categories_update_own" on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id and is_system = false)
  with check ((select auth.uid()) = user_id and is_system = false);
create policy "categories_delete_own" on public.categories
  for delete to authenticated
  using ((select auth.uid()) = user_id and is_system = false);

-- ---------------------------------------------------------- import_batches
create policy "import_batches_select_own" on public.import_batches
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "import_batches_insert_own" on public.import_batches
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "import_batches_update_own" on public.import_batches
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "import_batches_delete_own" on public.import_batches
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------ transactions
create policy "transactions_select_own" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transactions_update_own" on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------- category_rules
create policy "category_rules_select_own_or_system" on public.category_rules
  for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);
create policy "category_rules_insert_own" on public.category_rules
  for insert to authenticated
  with check ((select auth.uid()) = user_id and source = 'learned');
create policy "category_rules_update_own" on public.category_rules
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "category_rules_delete_own" on public.category_rules
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------- budgets
create policy "budgets_select_own" on public.budgets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "budgets_insert_own" on public.budgets
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "budgets_update_own" on public.budgets
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "budgets_delete_own" on public.budgets
  for delete to authenticated using ((select auth.uid()) = user_id);

-- --------------------------------------------------------- recommendations
create policy "recommendations_select_own" on public.recommendations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "recommendations_insert_own" on public.recommendations
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "recommendations_update_own" on public.recommendations
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recommendations_delete_own" on public.recommendations
  for delete to authenticated using ((select auth.uid()) = user_id);

-- --------------------------------------------------------- security_events
-- Nutzer dürfen ihr eigenes Audit-Log lesen, aber niemals schreiben oder ändern.
-- Einträge werden ausschließlich serverseitig über den Service-Role-Client erzeugt.
create policy "security_events_select_own" on public.security_events
  for select to authenticated using ((select auth.uid()) = user_id);

-- ============================================================
-- 20260731100011_seed_system_data.sql
-- ============================================================
-- System-Stammdaten: Default-Kategorien und Kategorisierungsregeln für den
-- deutschen Markt. Als Migration (nicht als seed.sql), damit sie auch in
-- Produktion deterministisch vorhanden sind.

insert into public.categories (slug, name, icon, color, kind, is_system, sort_order) values
  ('essen',          'Essen & Lebensmittel', 'shopping-basket',  '#f97316', 'expense', true, 10),
  ('freizeit',       'Freizeit',             'party-popper',     '#ec4899', 'expense', true, 20),
  ('shopping',       'Shopping',             'shopping-bag',     '#8b5cf6', 'expense', true, 30),
  ('mobilitaet',     'Mobilität',            'car-front',        '#0ea5e9', 'expense', true, 40),
  ('bildung',        'Schule/Weiterbildung', 'graduation-cap',   '#14b8a6', 'expense', true, 50),
  ('arbeit',         'Arbeit',               'briefcase',        '#22c55e', 'income',  true, 60),
  ('versicherungen', 'Versicherungen',       'shield-check',     '#64748b', 'expense', true, 70),
  ('wohnen',         'Wohnen',               'house',            '#eab308', 'expense', true, 80),
  ('abonnements',    'Abonnements',          'repeat',           '#6366f1', 'expense', true, 90),
  ('sonstiges',      'Sonstiges',            'circle-dashed',    '#94a3b8', 'expense', true, 999);

-- Keyword-Regeln. match_value ist immer lowercase; die Rule-Engine vergleicht
-- gegen die kleingeschriebene Kombination aus Händlername und Verwendungszweck.
insert into public.category_rules (category_id, match_type, match_value, priority, source)
select c.id, 'keyword'::public.rule_match_type, v.keyword, v.priority, 'system'
from (values
  -- Essen & Lebensmittel
  ('essen', 'rewe', 100), ('essen', 'edeka', 100), ('essen', 'aldi', 100),
  ('essen', 'lidl', 100), ('essen', 'kaufland', 100), ('essen', 'penny', 100),
  ('essen', 'netto marken', 100), ('essen', 'norma', 100), ('essen', 'real,-', 100),
  ('essen', 'denns', 100), ('essen', 'alnatura', 100), ('essen', 'bioc', 90),
  ('essen', 'baecker', 90), ('essen', 'bäcker', 90), ('essen', 'backwerk', 90),
  ('essen', 'metzgerei', 90), ('essen', 'getraenke', 90), ('essen', 'getränke',  90),
  ('essen', 'mcdonald', 90), ('essen', 'burger king', 90), ('essen', 'subway', 90),
  ('essen', 'kfc', 90), ('essen', 'lieferando', 90), ('essen', 'wolt', 90),
  ('essen', 'uber eats', 90), ('essen', 'dominos', 90), ('essen', 'restaurant', 80),
  ('essen', 'pizzeria', 80), ('essen', 'cafe', 70), ('essen', 'starbucks', 90),
  ('essen', 'gorillas', 90), ('essen', 'flink', 85), ('essen', 'picnic', 90),

  -- Mobilität
  ('mobilitaet', 'deutsche bahn', 100), ('mobilitaet', 'db vertrieb', 100),
  ('mobilitaet', 'db fernverkehr', 100), ('mobilitaet', 'flixbus', 100),
  ('mobilitaet', 'bvg', 100), ('mobilitaet', 'mvg', 100), ('mobilitaet', 'hvv', 100),
  ('mobilitaet', 'rmv', 100), ('mobilitaet', 'vrr', 100), ('mobilitaet', 'vvs', 100),
  ('mobilitaet', 'deutschlandticket', 100), ('mobilitaet', 'shell', 95),
  ('mobilitaet', 'aral', 95), ('mobilitaet', 'esso', 95), ('mobilitaet', 'total energies', 95),
  ('mobilitaet', 'jet tankstelle', 95), ('mobilitaet', 'tankstelle', 85),
  ('mobilitaet', 'uber', 90), ('mobilitaet', 'freenow', 90), ('mobilitaet', 'bolt', 85),
  ('mobilitaet', 'tier mobility', 90), ('mobilitaet', 'lime', 85), ('mobilitaet', 'nextbike', 90),
  ('mobilitaet', 'sixt', 90), ('mobilitaet', 'europcar', 90), ('mobilitaet', 'adac', 85),
  ('mobilitaet', 'parkhaus', 85), ('mobilitaet', 'werkstatt', 80), ('mobilitaet', 'tuev', 85),
  ('mobilitaet', 'tüv', 85), ('mobilitaet', 'kfz-steuer', 95), ('mobilitaet', 'lufthansa', 90),
  ('mobilitaet', 'ryanair', 90), ('mobilitaet', 'eurowings', 90),

  -- Wohnen
  ('wohnen', 'miete', 110), ('wohnen', 'kaltmiete', 110), ('wohnen', 'warmmiete', 110),
  ('wohnen', 'nebenkosten', 105), ('wohnen', 'hausgeld', 105), ('wohnen', 'wohnung', 90),
  ('wohnen', 'stadtwerke', 100), ('wohnen', 'vattenfall', 100), ('wohnen', 'e.on', 100),
  ('wohnen', 'eon energie', 100), ('wohnen', 'rwe', 100), ('wohnen', 'enbw', 100),
  ('wohnen', 'yello strom', 100), ('wohnen', 'lichtblick', 100), ('wohnen', 'strom', 85),
  ('wohnen', 'gasversorgung', 95), ('wohnen', 'wasserwerke', 95),
  ('wohnen', 'telekom', 95), ('wohnen', 'vodafone', 95), ('wohnen', '1&1', 95),
  ('wohnen', 'o2 germany', 95), ('wohnen', 'pyur', 95), ('wohnen', 'rundfunk', 100),
  ('wohnen', 'ard zdf', 100), ('wohnen', 'ikea', 85), ('wohnen', 'obi', 85),
  ('wohnen', 'bauhaus', 85), ('wohnen', 'hornbach', 85), ('wohnen', 'toom', 85),

  -- Abonnements
  ('abonnements', 'netflix', 110), ('abonnements', 'spotify', 110),
  ('abonnements', 'disney', 110), ('abonnements', 'amazon prime', 110),
  ('abonnements', 'apple.com/bill', 105), ('abonnements', 'itunes', 100),
  ('abonnements', 'google one', 105), ('abonnements', 'youtube premium', 110),
  ('abonnements', 'dazn', 110), ('abonnements', 'sky deutschland', 110),
  ('abonnements', 'wow tv', 105), ('abonnements', 'paramount', 105),
  ('abonnements', 'audible', 110), ('abonnements', 'adobe', 105),
  ('abonnements', 'microsoft 365', 110), ('abonnements', 'dropbox', 105),
  ('abonnements', 'icloud', 105), ('abonnements', 'notion labs', 105),
  ('abonnements', 'openai', 105), ('abonnements', 'anthropic', 105),
  ('abonnements', 'fitnessstudio', 100), ('abonnements', 'mcfit', 105),
  ('abonnements', 'fitx', 105), ('abonnements', 'urban sports', 105),
  ('abonnements', 'abo ', 70),

  -- Shopping
  ('shopping', 'amazon', 90), ('shopping', 'zalando', 100), ('shopping', 'otto', 95),
  ('shopping', 'about you', 100), ('shopping', 'h&m', 100), ('shopping', 'zara', 100),
  ('shopping', 'c&a', 100), ('shopping', 'primark', 100), ('shopping', 'tk maxx', 100),
  ('shopping', 'douglas', 100), ('shopping', 'dm-drogerie', 100), ('shopping', 'rossmann', 100),
  ('shopping', 'mueller ', 90), ('shopping', 'saturn', 100), ('shopping', 'mediamarkt', 100),
  ('shopping', 'media markt', 100), ('shopping', 'cyberport', 100), ('shopping', 'notebooksbilliger', 100),
  ('shopping', 'apple store', 100), ('shopping', 'ebay', 90), ('shopping', 'etsy', 95),
  ('shopping', 'shein', 100), ('shopping', 'temu', 100), ('shopping', 'decathlon', 100),
  ('shopping', 'thalia', 95), ('shopping', 'hugendubel', 95),

  -- Freizeit
  ('freizeit', 'kino', 95), ('freizeit', 'cinemaxx', 100), ('freizeit', 'cineplex', 100),
  ('freizeit', 'uci kinowelt', 100), ('freizeit', 'theater', 90), ('freizeit', 'museum', 90),
  ('freizeit', 'eventim', 100), ('freizeit', 'ticketmaster', 100), ('freizeit', 'konzert', 90),
  ('freizeit', 'schwimmbad', 95), ('freizeit', 'therme', 95), ('freizeit', 'zoo', 90),
  ('freizeit', 'freizeitpark', 95), ('freizeit', 'bar ', 70), ('freizeit', 'club ', 70),
  ('freizeit', 'steam games', 100), ('freizeit', 'playstation', 100),
  ('freizeit', 'nintendo', 100), ('freizeit', 'xbox', 100), ('freizeit', 'epic games', 100),
  ('freizeit', 'booking.com', 95), ('freizeit', 'airbnb', 95), ('freizeit', 'hotel', 80),
  ('freizeit', 'sportverein', 90),

  -- Schule/Weiterbildung
  ('bildung', 'studienbeitrag', 110), ('bildung', 'semesterbeitrag', 110),
  ('bildung', 'universitaet', 100), ('bildung', 'universität', 100),
  ('bildung', 'hochschule', 100), ('bildung', 'fachhochschule', 100),
  ('bildung', 'volkshochschule', 100), ('bildung', 'sprachschule', 100),
  ('bildung', 'fahrschule', 100), ('bildung', 'nachhilfe', 100),
  ('bildung', 'udemy', 100), ('bildung', 'coursera', 100), ('bildung', 'skillshare', 100),
  ('bildung', 'bafoeg', 100), ('bildung', 'bafög', 100), ('bildung', 'schulgeld', 100),
  ('bildung', 'lehrbuch', 90),

  -- Versicherungen
  ('versicherungen', 'versicherung', 110), ('versicherungen', 'allianz', 105),
  ('versicherungen', 'axa', 105), ('versicherungen', 'huk', 105),
  ('versicherungen', 'ergo ', 105), ('versicherungen', 'debeka', 105),
  ('versicherungen', 'signal iduna', 105), ('versicherungen', 'devk', 105),
  ('versicherungen', 'r+v', 105), ('versicherungen', 'generali', 105),
  ('versicherungen', 'cosmos direkt', 105), ('versicherungen', 'krankenkasse', 110),
  ('versicherungen', 'aok', 105), ('versicherungen', 'techniker krankenkasse', 110),
  ('versicherungen', 'barmer', 105), ('versicherungen', 'dak', 105),
  ('versicherungen', 'haftpflicht', 105), ('versicherungen', 'hausrat', 105),
  ('versicherungen', 'rechtsschutz', 105),

  -- Arbeit / Einnahmen
  ('arbeit', 'gehalt', 120), ('arbeit', 'lohn', 120), ('arbeit', 'lohn/gehalt', 120),
  ('arbeit', 'bezuege', 115), ('arbeit', 'bezüge', 115), ('arbeit', 'entgelt', 115),
  ('arbeit', 'honorar', 110), ('arbeit', 'rechnung nr', 90),
  ('arbeit', 'ausbildungsverguetung', 115), ('arbeit', 'ausbildungsvergütung', 115),
  ('arbeit', 'praktikumsverguetung', 115), ('arbeit', 'minijob', 110),
  ('arbeit', 'kindergeld', 110), ('arbeit', 'steuererstattung', 110),
  ('arbeit', 'finanzamt', 100)
) as v(slug, keyword, priority)
join public.categories c on c.slug = v.slug and c.user_id is null;

-- ============================================================
-- 20260731172519_harden_function_grants.sql
-- ============================================================
-- Least Privilege für Trigger-Funktionen.
--
-- Trigger- und Event-Trigger-Funktionen lassen sich zwar nicht sinnvoll direkt
-- aufrufen (Postgres lehnt das mit "trigger functions can only be called as
-- triggers" ab), sie sind über PostgREST aber dennoch als RPC-Endpunkt sichtbar.
-- Da sie SECURITY DEFINER sind, wird das EXECUTE-Recht hier entzogen: die
-- Funktionen werden ausschließlich von Triggern aufgerufen, nie über die API.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Von Supabase angelegtes Sicherheitsnetz: aktiviert RLS automatisch auf jeder
-- neu erstellten Tabelle in public. Wird bewusst beibehalten, aber ebenfalls
-- aus der öffentlichen API entfernt.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;

-- ============================================================
-- 20260731174414_fix_category_rules_upsert.sql
-- ============================================================
-- Behebt den Lernmechanismus: Der Upsert in learnFromCorrection() schlug fehl.
--
-- Bisher gab es zwei partielle Unique-Indizes (einer für System-, einer für
-- Nutzerregeln). Postgres akzeptiert ON CONFLICT auf einem partiellen Index nur,
-- wenn dessen WHERE-Bedingung mit angegeben wird — PostgREST kann das nicht.
-- Jede manuelle Kategoriekorrektur lief deshalb in
--   42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification
--
-- Lösung: ein einziger Index über alle drei Spalten mit NULLS NOT DISTINCT
-- (Postgres 15+). Damit gelten mehrere System-Regeln (user_id IS NULL) mit
-- gleichem match_type/match_value als Duplikat — genau wie zuvor —, aber
-- ON CONFLICT (user_id, match_type, match_value) greift ohne Zusatzbedingung.

drop index if exists public.category_rules_system_uniq;
drop index if exists public.category_rules_user_uniq;

create unique index if not exists category_rules_uniq
  on public.category_rules (user_id, match_type, match_value) nulls not distinct;

-- ============================================================
-- 20260731175226_foreign_key_indexes.sql
-- ============================================================
-- Deckende Indizes für Fremdschlüssel.
--
-- Ohne sie muss Postgres beim Löschen einer Kategorie bzw. eines Kontos die
-- referenzierenden Tabellen vollständig durchsuchen. Bei transactions ist das
-- der teuerste Fall: der vorhandene Index (user_id, category_id) hilft nicht,
-- weil die Fremdschlüsselprüfung allein nach category_id sucht.

create index if not exists transactions_category_id_idx
  on public.transactions (category_id);
create index if not exists category_rules_category_id_idx
  on public.category_rules (category_id);
create index if not exists budgets_category_id_idx
  on public.budgets (category_id);
create index if not exists import_batches_account_id_idx
  on public.import_batches (account_id);

-- ============================================================
-- Profile für bereits registrierte Benutzer nachtragen
-- ============================================================
insert into public.profiles (id, display_name)
select u.id, nullif(trim(coalesce(u.raw_user_meta_data ->> 'display_name', '')), '')
from auth.users u
on conflict (id) do nothing;

-- ============================================================
-- Migrations-Historie für die Supabase-CLI
-- ============================================================
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'supabase_migrations' and table_name = 'schema_migrations'
  ) then
    insert into supabase_migrations.schema_migrations (version) values
      ('20260731100001'),
      ('20260731100002'),
      ('20260731100003'),
      ('20260731100004'),
      ('20260731100005'),
      ('20260731100006'),
      ('20260731100007'),
      ('20260731100008'),
      ('20260731100009'),
      ('20260731100010'),
      ('20260731100011'),
      ('20260731172519'),
      ('20260731174414'),
      ('20260731175226')
    on conflict (version) do nothing;
  end if;
end
$$;

-- ============================================================
-- API-Schema-Cache neu laden
-- ============================================================
notify pgrst, 'reload schema';
