-- Abweichender Abrechnungsmonat je Buchung.
--
-- Anlass: Gehalt wird oft am Monatsende gebucht, zaehlt aber als Einnahme des
-- Folgemonats. Ohne Zuordnung verzerrt das Sparrate und Monatsvergleich.
--
-- Bewusst als Text im Format JJJJ-MM statt als Datum: Die Anwendung rechnet
-- durchgehend mit Monatsschluesseln dieser Form (siehe lib/utils/date.ts), eine
-- Umrechnung an jeder Auswertungsstelle waere eine zusaetzliche Fehlerquelle.
-- NULL bedeutet: Buchungsdatum gilt, wie bisher.

alter table public.transactions
  add column if not exists accounting_month text
    check (accounting_month is null or accounting_month ~ '^\d{4}-(0[1-9]|1[0-2])$');

comment on column public.transactions.accounting_month is
  'Abweichender Abrechnungsmonat (JJJJ-MM). NULL = Monat des Buchungsdatums.';

-- Deckt die Auswertungen ab, die gezielt nach zugeordnetem Monat filtern.
create index if not exists transactions_accounting_month_idx
  on public.transactions (user_id, accounting_month)
  where accounting_month is not null;
