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
