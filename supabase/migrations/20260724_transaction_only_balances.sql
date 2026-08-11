-- Chuyển mô hình số dư:
-- - Ví chỉ là nơi chứa tiền và luôn bắt đầu từ 0.
-- - Chỉ giao dịch thu/chi làm thay đổi số dư.
-- - Tổng số dư bằng tổng số dư của tất cả ví, kể cả ví đã lưu trữ.
-- Chạy một lần trong Supabase Dashboard > SQL Editor cho project hiện có.

begin;

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

alter table public.transactions
  drop constraint if exists transactions_wallet_id_fkey,
  drop constraint if exists transactions_wallet_owner_fkey;

alter table public.transactions
  add constraint transactions_wallet_owner_fkey
  foreign key (wallet_id, user_id)
  references public.wallets (id, user_id)
  on delete restrict;

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

grant select on table public.wallet_balances to authenticated;

commit;
