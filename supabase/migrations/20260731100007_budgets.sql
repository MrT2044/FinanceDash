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
