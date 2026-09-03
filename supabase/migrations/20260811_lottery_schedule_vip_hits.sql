begin;

create extension if not exists pgcrypto;

create table if not exists public.lottery_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  play_type text not null check (play_type in ('lo', 'de', 'xien', 'other')),
  region text not null default 'north',
  market text not null default 'north',
  station text not null default 'Hà Nội',
  numbers text[] not null,
  hit_numbers text[] not null default '{}',
  stake numeric(16, 0) not null check (stake > 0),
  payout numeric(16, 0) not null default 0 check (payout >= 0),
  status text not null default 'pending' check (status in ('pending', 'won', 'lost')),
  draw_date date not null default current_date,
  draw_time text not null default '18:15',
  note text,
  result_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lottery_entries
  add column if not exists region text not null default 'north',
  add column if not exists station text not null default 'Hà Nội',
  add column if not exists market text,
  add column if not exists hit_numbers text[] not null default '{}',
  add column if not exists draw_time text,
  add column if not exists result_updated_at timestamptz;

update public.lottery_entries
set market = case
  when station = 'Hà Nội VIP' then 'hanoi_vip'
  when station = 'TP.HCM VIP' then 'hcm_vip'
  else region
end
where market is null;

update public.lottery_entries
set draw_time = case market
  when 'south' then '16:15'
  when 'central' then '17:15'
  when 'hcm_vip' then '17:30'
  else '18:15'
end
where draw_time is null;

-- Bản ghi trúng cũ chưa lưu số dính: giữ tương thích bằng cách đánh dấu các số cũ.
update public.lottery_entries
set hit_numbers = numbers
where status = 'won' and cardinality(hit_numbers) = 0;

update public.lottery_entries
set result_updated_at = updated_at
where status <> 'pending' and result_updated_at is null;

alter table public.lottery_entries
  alter column market set not null,
  alter column draw_time set not null,
  alter column market set default 'north',
  alter column draw_time set default '18:15';

alter table public.lottery_entries drop constraint if exists lottery_entries_market_check;
alter table public.lottery_entries add constraint lottery_entries_market_check
  check (market in ('south','central','north','hanoi_vip','hcm_vip'));
alter table public.lottery_entries drop constraint if exists lottery_entries_region_check;
alter table public.lottery_entries add constraint lottery_entries_region_check
  check (region in ('north','central','south'));
alter table public.lottery_entries drop constraint if exists lottery_entries_station_check;
alter table public.lottery_entries add constraint lottery_entries_station_check
  check (char_length(station) between 1 and 60);
alter table public.lottery_entries drop constraint if exists lottery_entries_numbers_check;
alter table public.lottery_entries add constraint lottery_entries_numbers_check
  check (
    cardinality(numbers) between 1 and 10
    and array_to_string(numbers, ',') ~ '^[0-9]{2}(,[0-9]{2}){0,9}$'
  );
alter table public.lottery_entries drop constraint if exists lottery_entries_stake_check;
alter table public.lottery_entries add constraint lottery_entries_stake_check
  check (stake between 1 and 9007199254740991);
alter table public.lottery_entries drop constraint if exists lottery_entries_payout_check;
alter table public.lottery_entries drop constraint if exists lottery_entries_payout_nonnegative_check;
alter table public.lottery_entries add constraint lottery_entries_payout_nonnegative_check
  check (payout between 0 and 9007199254740991);
alter table public.lottery_entries drop constraint if exists lottery_entries_status_payout_check;
alter table public.lottery_entries add constraint lottery_entries_status_payout_check
  check (
    (status = 'won' and payout > 0)
    or (status in ('pending', 'lost') and payout = 0)
  );
alter table public.lottery_entries drop constraint if exists lottery_entries_draw_time_check;
alter table public.lottery_entries add constraint lottery_entries_draw_time_check
  check (draw_time ~ '^[0-2][0-9]:[0-5][0-9]$');
alter table public.lottery_entries drop constraint if exists lottery_entries_hit_numbers_check;
alter table public.lottery_entries add constraint lottery_entries_hit_numbers_check
  check (hit_numbers <@ numbers);

create index if not exists lottery_entries_user_date_idx
  on public.lottery_entries (user_id, draw_date desc);

alter table public.lottery_entries enable row level security;
revoke all on table public.lottery_entries from public, anon;
grant select, insert, update, delete on table public.lottery_entries to authenticated;

drop policy if exists "lottery_entries_select_own" on public.lottery_entries;
create policy "lottery_entries_select_own" on public.lottery_entries
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "lottery_entries_insert_own" on public.lottery_entries;
create policy "lottery_entries_insert_own" on public.lottery_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "lottery_entries_update_own" on public.lottery_entries;
create policy "lottery_entries_update_own" on public.lottery_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "lottery_entries_delete_own" on public.lottery_entries;
create policy "lottery_entries_delete_own" on public.lottery_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

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
drop trigger if exists lottery_entries_set_updated_at on public.lottery_entries;
create trigger lottery_entries_set_updated_at
  before update on public.lottery_entries
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
commit;
