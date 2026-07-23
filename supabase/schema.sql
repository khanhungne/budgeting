-- Ví Nhỏ - schema khởi tạo
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor.

begin;

create extension if not exists pgcrypto;

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('cash', 'bank', 'ewallet', 'other')),
  opening_balance numeric(16, 0) not null default 0
    check (opening_balance between 0 and 9007199254740991),
  color text not null default '#13795b' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_id_user_key unique (id, user_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  wallet_id uuid,
  kind text not null check (kind in ('expense', 'income')),
  amount numeric(16, 0) not null check (amount between 1 and 9007199254740991),
  category text not null check (char_length(category) between 1 and 40),
  note text check (note is null or char_length(note) <= 120),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists wallet_id uuid;

create index if not exists wallets_user_created_idx
  on public.wallets (user_id, created_at);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);

create index if not exists transactions_user_wallet_idx
  on public.transactions (user_id, wallet_id);

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month_start date not null,
  amount numeric(16, 0) not null check (amount between 1 and 9007199254740991),
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
  numbers text[] not null check (
    cardinality(numbers) between 1 and 10
    and array_to_string(numbers, ',') ~ '^[0-9]{2}(,[0-9]{2}){0,9}$'
  ),
  stake numeric(16, 0) not null check (stake between 1 and 9007199254740991),
  payout numeric(16, 0) not null default 0
    constraint lottery_entries_payout_nonnegative_check
    check (payout between 0 and 9007199254740991),
  status text not null default 'pending' check (status in ('pending', 'won', 'lost')),
  draw_date date not null default current_date,
  note text check (note is null or char_length(note) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lottery_entries_status_payout_check check (
    (status = 'won' and payout > 0)
    or (status in ('pending', 'lost') and payout = 0)
  )
);

create table if not exists public.lottery_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month_start date not null,
  amount numeric(16, 0) not null check (amount between 1 and 9007199254740991),
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

-- Giữ dữ liệu số tương thích với Number.isSafeInteger ở frontend.
alter table public.wallets
  drop constraint if exists wallets_opening_balance_check;
alter table public.wallets
  add constraint wallets_opening_balance_check
  check (opening_balance between 0 and 9007199254740991);

alter table public.transactions
  drop constraint if exists transactions_amount_check;
alter table public.transactions
  add constraint transactions_amount_check
  check (amount between 1 and 9007199254740991);

alter table public.monthly_budgets
  drop constraint if exists monthly_budgets_amount_check;
alter table public.monthly_budgets
  add constraint monthly_budgets_amount_check
  check (amount between 1 and 9007199254740991);

alter table public.lottery_entries
  drop constraint if exists lottery_entries_numbers_check,
  drop constraint if exists lottery_entries_stake_check,
  drop constraint if exists lottery_entries_payout_check,
  drop constraint if exists lottery_entries_payout_nonnegative_check,
  drop constraint if exists lottery_entries_status_payout_check;
alter table public.lottery_entries
  add constraint lottery_entries_numbers_check
    check (
      cardinality(numbers) between 1 and 10
      and array_to_string(numbers, ',') ~ '^[0-9]{2}(,[0-9]{2}){0,9}$'
    ),
  add constraint lottery_entries_stake_check
    check (stake between 1 and 9007199254740991),
  add constraint lottery_entries_payout_nonnegative_check
    check (payout between 0 and 9007199254740991),
  add constraint lottery_entries_status_payout_check
    check (
      (status = 'won' and payout > 0)
      or (status in ('pending', 'lost') and payout = 0)
    );

alter table public.lottery_limits
  drop constraint if exists lottery_limits_amount_check;
alter table public.lottery_limits
  add constraint lottery_limits_amount_check
  check (amount between 1 and 9007199254740991);

-- Ví và giao dịch phải cùng chủ sở hữu; xoá ví chỉ bỏ liên kết, không xoá giao dịch.
alter table public.transactions
  drop constraint if exists transactions_wallet_id_fkey;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallets_id_user_key'
      and conrelid = 'public.wallets'::regclass
  ) then
    alter table public.wallets
      add constraint wallets_id_user_key unique (id, user_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_wallet_owner_fkey'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_wallet_owner_fkey
      foreign key (wallet_id, user_id)
      references public.wallets (id, user_id)
      on delete set null (wallet_id);
  end if;
end
$$;

create index if not exists lottery_entries_user_date_idx
  on public.lottery_entries (user_id, draw_date desc);

alter table public.transactions enable row level security;
alter table public.wallets enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.lottery_entries enable row level security;
alter table public.lottery_limits enable row level security;

-- Tính số dư ngay trong PostgreSQL để không tải toàn bộ lịch sử giao dịch về máy.
create or replace view public.wallet_balances
with (security_invoker = true)
as
select
  wallet.id as wallet_id,
  wallet.user_id,
  wallet.opening_balance
    + coalesce(
        sum(
          case
            when tx.kind = 'income' then tx.amount
            else -tx.amount
          end
        ),
        0
      ) as balance
from public.wallets as wallet
left join public.transactions as tx
  on tx.wallet_id = wallet.id
  and tx.user_id = wallet.user_id
group by wallet.id, wallet.user_id, wallet.opening_balance;

-- Chỉ tài khoản đã đăng nhập mới được gọi CRUD; RLS tiếp tục giới hạn từng dòng.
revoke all on table public.transactions from public, anon;
grant select, insert, update, delete on table public.transactions to authenticated;
revoke all on table public.wallets from public, anon;
grant select, insert, update, delete on table public.wallets to authenticated;
revoke all on table public.monthly_budgets from public, anon;
grant select, insert, update, delete on table public.monthly_budgets to authenticated;
revoke all on table public.lottery_entries from public, anon;
grant select, insert, update, delete on table public.lottery_entries to authenticated;
revoke all on table public.lottery_limits from public, anon;
grant select, insert, update, delete on table public.lottery_limits to authenticated;
revoke all on table public.wallet_balances from public, anon;
grant select on table public.wallet_balances to authenticated;

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
