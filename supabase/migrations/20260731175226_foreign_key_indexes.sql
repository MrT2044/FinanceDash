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
