begin;

create extension if not exists pgcrypto;

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person text not null check (char_length(person) between 1 and 60),
  amount numeric(16, 0) not null check (amount between 1 and 9007199254740991),
  direction text not null check (direction in ('i_owe', 'owed_to_me')),
  status text not null default 'pending',
  occurred_on date not null default current_date,
  due_on date,
  paid_on date,
  note text check (note is null or char_length(note) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.debts
  add column if not exists occurred_on date,
  add column if not exists paid_on date;

update public.debts
set occurred_on = created_at::date
where occurred_on is null;

alter table public.debts
  alter column occurred_on set default current_date,
  alter column occurred_on set not null;

alter table public.debts drop constraint if exists debts_status_check;
update public.debts set status = 'pending' where status = 'open';
alter table public.debts alter column status set default 'pending';
alter table public.debts add constraint debts_status_check check (status in ('pending','paid'));

update public.debts
set paid_on = updated_at::date
where status = 'paid' and paid_on is null;

create index if not exists debts_user_status_idx
  on public.debts (user_id, status, created_at desc);

alter table public.debts enable row level security;
revoke all on table public.debts from public, anon;
grant select, insert, update, delete on table public.debts to authenticated;

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

drop trigger if exists debts_set_updated_at on public.debts;
create trigger debts_set_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

commit;
