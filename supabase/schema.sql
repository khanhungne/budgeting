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
alter table public.transactions
  add column if not exists receipt_image text;
alter table public.transactions
  add column if not exists receipt_attached boolean not null default false;

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
  unique (user_id, month_start, category),
  check (month_start = date_trunc('month', month_start)::date)
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

insert into public.categories (id,user_id,label,emoji,kind,color)
select defaults.id, users.id, defaults.label, defaults.emoji, defaults.kind, defaults.color
from auth.users users cross join (values
  ('food','Ăn uống','🍜','expense','#ef8f67'),('transport','Đi lại','🛵','expense','#6fa8dc'),
  ('shopping','Mua sắm','🛍️','expense','#bf8ed8'),('bills','Hoá đơn','🧾','expense','#e6b85c'),
  ('health','Sức khoẻ','💊','expense','#e67b88'),('education','Học tập','📚','expense','#6ab5a1'),
  ('fun','Giải trí','🎮','expense','#778bd4'),('other-expense','Khác','📦','expense','#9aa19d'),
  ('salary','Lương','💼','income','#4ca77b'),('bonus','Thưởng','🎁','income','#71b45d'),
  ('investment','Đầu tư','📈','income','#3e91a3'),('other-income','Thu khác','💰','income','#72a96b')
) defaults(id,label,emoji,kind,color) on conflict (id,user_id) do nothing;

insert into public.categories (id,user_id,label,emoji,kind,color)
select tx.category,tx.user_id,left(tx.category,18),'📌',min(tx.kind),case when min(tx.kind)='income' then '#059669' else '#d97706' end
from public.transactions tx left join public.categories c on c.id=tx.category and c.user_id=tx.user_id
where c.id is null group by tx.category,tx.user_id on conflict (id,user_id) do nothing;

alter table public.transactions
  drop constraint if exists transactions_category_owner_fkey;
alter table public.transactions
  add constraint transactions_category_owner_fkey
  foreign key (category, user_id) references public.categories (id, user_id) on delete restrict;
alter table public.category_budgets
  drop constraint if exists category_budgets_category_owner_fkey;
alter table public.category_budgets
  add constraint category_budgets_category_owner_fkey
  foreign key (category, user_id) references public.categories (id, user_id) on delete restrict;

create table if not exists public.lottery_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  play_type text not null check (play_type in ('lo', 'de', 'xien', 'other')),
  region text not null check (region in ('north', 'central', 'south')),
  market text not null default 'north' check (market in ('south','central','north','hanoi_vip','hcm_vip')),
  station text not null check (char_length(station) between 1 and 60),
  numbers text[] not null check (
    cardinality(numbers) between 1 and 10
    and array_to_string(numbers, ',') ~ '^[0-9]{2}(,[0-9]{2}){0,9}$'
  ),
  hit_numbers text[] not null default '{}',
  stake numeric(16, 0) not null check (stake between 1 and 9007199254740991),
  payout numeric(16, 0) not null default 0
    constraint lottery_entries_payout_nonnegative_check
    check (payout between 0 and 9007199254740991),
  status text not null default 'pending' check (status in ('pending', 'won', 'lost')),
  draw_date date not null default current_date,
  draw_time text not null default '18:15',
  note text check (note is null or char_length(note) <= 120),
  result_updated_at timestamptz,
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

-- Mỗi giao dịch phải thuộc một ví. Tạo ví mặc định cho dữ liệu cũ chưa có ví.
insert into public.wallets (user_id, name, kind, opening_balance, color)
select distinct
  tx.user_id,
  'Tiền mặt',
  'cash',
  0,
  '#1c5f50'
from public.transactions as tx
where tx.wallet_id is null
  and not exists (
    select 1
    from public.wallets as existing_wallet
    where existing_wallet.user_id = tx.user_id
  );

update public.transactions as tx
set wallet_id = (
  select wallet.id
  from public.wallets as wallet
  where wallet.user_id = tx.user_id
  order by wallet.is_archived, wallet.created_at, wallet.id
  limit 1
)
where tx.wallet_id is null;

-- Chuyển số dư ban đầu của phiên bản cũ thành giao dịch thu đúng một lần.
-- Sau update này, chạy lại schema sẽ không tạo giao dịch trùng.
insert into public.transactions (
  user_id,
  wallet_id,
  kind,
  amount,
  category,
  note,
  occurred_on,
  created_at,
  updated_at
)
select
  wallet.user_id,
  wallet.id,
  'income',
  wallet.opening_balance,
  'other-income',
  'Số dư khởi tạo (chuyển đổi tự động)',
  wallet.created_at::date,
  wallet.created_at,
  now()
from public.wallets as wallet
where wallet.opening_balance > 0;

update public.wallets
set opening_balance = 0,
    updated_at = now()
where opening_balance <> 0;

alter table public.wallets
  drop constraint if exists wallets_opening_balance_check;
alter table public.wallets
  add constraint wallets_opening_balance_check
  check (opening_balance = 0);

alter table public.transactions
  alter column wallet_id set not null;

-- Ví và giao dịch phải cùng chủ sở hữu; ví có lịch sử không được xoá trực tiếp.
alter table public.transactions
  drop constraint if exists transactions_wallet_id_fkey,
  drop constraint if exists transactions_wallet_owner_fkey;
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

  alter table public.transactions
    add constraint transactions_wallet_owner_fkey
    foreign key (wallet_id, user_id)
    references public.wallets (id, user_id)
    on delete restrict;
end
$$;

create index if not exists lottery_entries_user_date_idx
  on public.lottery_entries (user_id, draw_date desc);

alter table public.transactions enable row level security;
alter table public.wallets enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.lottery_entries enable row level security;
alter table public.lottery_limits enable row level security;
alter table public.category_budgets enable row level security;
alter table public.debts enable row level security;
alter table public.categories enable row level security;

-- Tính số dư ngay trong PostgreSQL để không tải toàn bộ lịch sử giao dịch về máy.
create or replace view public.wallet_balances
with (security_invoker = true)
as
select
  wallet.id as wallet_id,
  wallet.user_id,
  coalesce(
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
group by wallet.id, wallet.user_id;

-- Không cho thao tác mới làm số dư ví âm hơn. Dữ liệu âm từ phiên bản cũ vẫn
-- có thể được sửa bằng cách thêm khoản thu hoặc xoá khoản chi.
create or replace function public.enforce_nonnegative_wallet_balance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_wallet_id uuid;
  current_balance numeric(16, 0);
  previous_balance numeric(16, 0);
  old_effect numeric(16, 0);
  new_effect numeric(16, 0);
begin
  for affected_wallet_id in
    select distinct wallet_id
    from (
      values
        (case when tg_op <> 'DELETE' then new.wallet_id else null end),
        (case when tg_op <> 'INSERT' then old.wallet_id else null end)
    ) as affected(wallet_id)
    where wallet_id is not null
  loop
    perform 1
    from public.wallets
    where id = affected_wallet_id
    for update;

    select coalesce(
      sum(case when kind = 'income' then amount else -amount end),
      0
    )
    into current_balance
    from public.transactions
    where wallet_id = affected_wallet_id;

    old_effect := 0;
    if tg_op <> 'INSERT' and old.wallet_id = affected_wallet_id then
      old_effect := case when old.kind = 'income' then old.amount else -old.amount end;
    end if;

    new_effect := 0;
    if tg_op <> 'DELETE' and new.wallet_id = affected_wallet_id then
      new_effect := case when new.kind = 'income' then new.amount else -new.amount end;
    end if;

    previous_balance := current_balance - new_effect + old_effect;

    if current_balance < 0 and current_balance < previous_balance then
      raise exception 'Số dư ví không đủ cho thao tác này.'
        using errcode = '23514';
    end if;
  end loop;

  return null;
end;
$$;

revoke all on function public.enforce_nonnegative_wallet_balance()
  from public, anon, authenticated;

drop trigger if exists transactions_nonnegative_wallet_balance
  on public.transactions;
create constraint trigger transactions_nonnegative_wallet_balance
  after insert or update or delete on public.transactions
  deferrable initially immediate
  for each row
  execute function public.enforce_nonnegative_wallet_balance();

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
grant select, insert, update, delete on table public.category_budgets to authenticated;
grant select, insert, update, delete on table public.debts to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
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

drop policy if exists "categories_own" on public.categories;
create policy "categories_own" on public.categories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "category_budgets_own" on public.category_budgets;
create policy "category_budgets_own" on public.category_budgets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "debts_own" on public.debts;
create policy "debts_own" on public.debts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

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

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists category_budgets_set_updated_at on public.category_budgets;
create trigger category_budgets_set_updated_at
  before update on public.category_budgets
  for each row execute function public.set_updated_at();

drop trigger if exists debts_set_updated_at on public.debts;
create trigger debts_set_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();

commit;
