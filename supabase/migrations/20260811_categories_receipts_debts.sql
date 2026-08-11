begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

alter table public.transactions
  add column if not exists receipt_image text;

create table if not exists public.categories (
  id text not null check (char_length(id) between 1 and 40),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 18),
  emoji text not null default '📌',
  kind text not null check (kind in ('expense', 'income')),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month_start date not null,
  category text not null check (char_length(category) between 1 and 40),
  amount numeric(16, 0) not null check (amount between 1 and 9007199254740991),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_budgets_user_month_category_key unique (user_id, month_start, category),
  constraint category_budgets_first_day_check check (month_start = date_trunc('month', month_start)::date)
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person text not null check (char_length(person) between 1 and 60),
  amount numeric(16, 0) not null check (amount between 1 and 9007199254740991),
  direction text not null check (direction in ('i_owe', 'owed_to_me')),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  occurred_on date not null default current_date,
  due_on date,
  paid_on date,
  note text check (note is null or char_length(note) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists category_budgets_user_month_idx on public.category_budgets (user_id, month_start);
create index if not exists debts_user_status_idx on public.debts (user_id, status, created_at desc);
alter table public.category_budgets enable row level security;
alter table public.debts enable row level security;
alter table public.categories enable row level security;

revoke all on table public.category_budgets from public, anon;
revoke all on table public.debts from public, anon;
revoke all on table public.categories from public, anon;
grant select, insert, update, delete on table public.category_budgets to authenticated;
grant select, insert, update, delete on table public.debts to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;

drop policy if exists "category_budgets_own" on public.category_budgets;
create policy "category_budgets_own" on public.category_budgets for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "debts_own" on public.debts;
create policy "debts_own" on public.debts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "categories_own" on public.categories;
create policy "categories_own" on public.categories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop trigger if exists category_budgets_set_updated_at on public.category_budgets;
create trigger category_budgets_set_updated_at before update on public.category_budgets
  for each row execute function public.set_updated_at();
drop trigger if exists debts_set_updated_at on public.debts;
create trigger debts_set_updated_at before update on public.debts
  for each row execute function public.set_updated_at();
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

commit;
