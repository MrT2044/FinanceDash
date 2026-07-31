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
