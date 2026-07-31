-- Kontostand über den gesamten Bestand.
--
-- Das Dashboard lädt aus Performancegründen nur die letzten 12 Monate. Der
-- Kontostand muss aber alle Buchungen umfassen, sonst stimmt die Kennzahl
-- sobald jemand einen längeren Zeitraum importiert.
--
-- SECURITY INVOKER (Standard): die Funktion läuft mit den Rechten des
-- Aufrufers, RLS greift also unverändert und liefert nur eigene Buchungen.

create or replace function public.current_balance()
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::numeric
  from public.transactions;
$$;

revoke all on function public.current_balance() from public, anon;
grant execute on function public.current_balance() to authenticated;
