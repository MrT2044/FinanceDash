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
