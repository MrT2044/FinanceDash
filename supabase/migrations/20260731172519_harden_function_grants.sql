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
