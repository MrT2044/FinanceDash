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
