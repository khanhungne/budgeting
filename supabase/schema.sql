-- Ví Nhỏ - schema khởi tạo
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor.

begin;

create extension if not exists pgcrypto;

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('cash', 'bank', 'ewallet', 'other')),
  opening_balance numeric(16, 0) not null default 0 check (opening_balance >= 0),
  color text not null default '#13795b' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  kind text not null check (kind in ('expense', 'income')),
  amount numeric(16, 0) not null check (amount > 0),
  category text not null check (char_length(category) between 1 and 40),
  note text check (note is null or char_length(note) <= 120),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists wallet_id uuid references public.wallets(id) on delete set null;

create index if not exists wallets_user_created_idx
  on public.wallets (user_id, created_at);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month_start date not null,
  amount numeric(16, 0) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_budgets_user_month_key unique (user_id, month_start),
  constraint monthly_budgets_first_day_check
    check (month_start = date_trunc('month', month_start)::date)
);

create table if not exists public.lottery_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  play_type text not null check (play_type in ('lo', 'de', 'xien', 'other')),
  region text not null check (region in ('north', 'central', 'south')),
  station text not null check (char_length(station) between 1 and 60),
  numbers text[] not null check (cardinality(numbers) between 1 and 10),
  stake numeric(16, 0) not null check (stake > 0),
  payout numeric(16, 0) not null default 0 check (payout >= 0),
  status text not null default 'pending' check (status in ('pending', 'won', 'lost')),
  draw_date date not null default current_date,
  note text check (note is null or char_length(note) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lottery_entries_payout_check check (
    (status = 'won' and payout > 0)
    or (status in ('pending', 'lost') and payout = 0)
  )
);

create table if not exists public.lottery_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month_start date not null,
  amount numeric(16, 0) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lottery_limits_user_month_key unique (user_id, month_start),
  constraint lottery_limits_first_day_check
    check (month_start = date_trunc('month', month_start)::date)
);

alter table public.lottery_entries
  add column if not exists region text not null default 'north',
  add column if not exists station text not null default 'Hà Nội';

alter table public.lottery_entries
  drop constraint if exists lottery_entries_region_check;
alter table public.lottery_entries
  add constraint lottery_entries_region_check
  check (region in ('north', 'central', 'south'));

alter table public.lottery_entries
  drop constraint if exists lottery_entries_station_check;
alter table public.lottery_entries
  add constraint lottery_entries_station_check
  check (char_length(station) between 1 and 60);

create index if not exists lottery_entries_user_date_idx
  on public.lottery_entries (user_id, draw_date desc);

alter table public.transactions enable row level security;
alter table public.wallets enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.lottery_entries enable row level security;
alter table public.lottery_limits enable row level security;

-- Chỉ tài khoản đã đăng nhập mới được gọi CRUD; RLS tiếp tục giới hạn từng dòng.
revoke all on table public.transactions from anon;
grant select, insert, update, delete on table public.transactions to authenticated;
revoke all on table public.wallets from anon;
grant select, insert, update, delete on table public.wallets to authenticated;
revoke all on table public.monthly_budgets from anon;
grant select, insert, update, delete on table public.monthly_budgets to authenticated;
revoke all on table public.lottery_entries from anon;
grant select, insert, update, delete on table public.lottery_entries to authenticated;
revoke all on table public.lottery_limits from anon;
grant select, insert, update, delete on table public.lottery_limits to authenticated;

drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own"
  on public.wallets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "wallets_insert_own" on public.wallets;
create policy "wallets_insert_own"
  on public.wallets
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_update_own"
  on public.wallets
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "wallets_delete_own" on public.wallets;
create policy "wallets_delete_own"
  on public.wallets
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
  on public.transactions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
  on public.transactions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
  on public.transactions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "monthly_budgets_select_own" on public.monthly_budgets;
create policy "monthly_budgets_select_own"
  on public.monthly_budgets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "monthly_budgets_insert_own" on public.monthly_budgets;
create policy "monthly_budgets_insert_own"
  on public.monthly_budgets
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "monthly_budgets_update_own" on public.monthly_budgets;
create policy "monthly_budgets_update_own"
  on public.monthly_budgets
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "monthly_budgets_delete_own" on public.monthly_budgets;
create policy "monthly_budgets_delete_own"
  on public.monthly_budgets
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "lottery_entries_select_own" on public.lottery_entries;
create policy "lottery_entries_select_own"
  on public.lottery_entries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "lottery_entries_insert_own" on public.lottery_entries;
create policy "lottery_entries_insert_own"
  on public.lottery_entries
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "lottery_entries_update_own" on public.lottery_entries;
create policy "lottery_entries_update_own"
  on public.lottery_entries
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "lottery_entries_delete_own" on public.lottery_entries;
create policy "lottery_entries_delete_own"
  on public.lottery_entries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "lottery_limits_select_own" on public.lottery_limits;
create policy "lottery_limits_select_own"
  on public.lottery_limits
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "lottery_limits_insert_own" on public.lottery_limits;
create policy "lottery_limits_insert_own"
  on public.lottery_limits
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "lottery_limits_update_own" on public.lottery_limits;
create policy "lottery_limits_update_own"
  on public.lottery_limits
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "lottery_limits_delete_own" on public.lottery_limits;
create policy "lottery_limits_delete_own"
  on public.lottery_limits
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

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

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

drop trigger if exists wallets_set_updated_at on public.wallets;
create trigger wallets_set_updated_at
  before update on public.wallets
  for each row
  execute function public.set_updated_at();

drop trigger if exists monthly_budgets_set_updated_at on public.monthly_budgets;
create trigger monthly_budgets_set_updated_at
  before update on public.monthly_budgets
  for each row
  execute function public.set_updated_at();

drop trigger if exists lottery_entries_set_updated_at on public.lottery_entries;
create trigger lottery_entries_set_updated_at
  before update on public.lottery_entries
  for each row
  execute function public.set_updated_at();

drop trigger if exists lottery_limits_set_updated_at on public.lottery_limits;
create trigger lottery_limits_set_updated_at
  before update on public.lottery_limits
  for each row
  execute function public.set_updated_at();

commit;
