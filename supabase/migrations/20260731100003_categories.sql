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
