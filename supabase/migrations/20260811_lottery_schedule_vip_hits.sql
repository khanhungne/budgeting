begin;

alter table public.lottery_entries
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
alter table public.lottery_entries drop constraint if exists lottery_entries_draw_time_check;
alter table public.lottery_entries add constraint lottery_entries_draw_time_check
  check (draw_time ~ '^[0-2][0-9]:[0-5][0-9]$');
alter table public.lottery_entries drop constraint if exists lottery_entries_hit_numbers_check;
alter table public.lottery_entries add constraint lottery_entries_hit_numbers_check
  check (hit_numbers <@ numbers);

notify pgrst, 'reload schema';
commit;
