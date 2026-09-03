-- Daily Web Push notifications for installed PWA devices.

begin;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  reminder_time time without time zone not null default '20:00',
  timezone text not null default 'Asia/Ho_Chi_Minh'
    check (char_length(timezone) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 20 and 4096),
  p256dh_key text not null check (char_length(p256dh_key) between 20 and 256),
  auth_key text not null check (char_length(auth_key) between 8 and 256),
  platform text not null default 'unknown'
    check (platform in ('android', 'ios', 'desktop', 'unknown')),
  user_agent text check (user_agent is null or char_length(user_agent) <= 512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delivery_date date not null,
  kind text not null default 'daily_reminder'
    check (kind in ('daily_reminder')),
  status text not null default 'processing'
    check (status in ('processing', 'sent', 'failed')),
  attempt_count smallint not null default 1 check (attempt_count between 1 and 3),
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, delivery_date, kind)
);

alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "notification_preferences_own" on public.notification_preferences;
create policy "notification_preferences_own"
  on public.notification_preferences
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.register_push_subscription(
  p_endpoint text,
  p_p256dh_key text,
  p_auth_key text,
  p_platform text default 'unknown',
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if char_length(p_endpoint) not between 20 and 4096
    or char_length(p_p256dh_key) not between 20 and 256
    or char_length(p_auth_key) not between 8 and 256
    or p_platform not in ('android', 'ios', 'desktop', 'unknown') then
    raise exception 'Invalid push subscription';
  end if;

  insert into public.push_subscriptions (
    user_id, endpoint, p256dh_key, auth_key, platform, user_agent
  ) values (
    v_user_id,
    p_endpoint,
    p_p256dh_key,
    p_auth_key,
    p_platform,
    left(p_user_agent, 512)
  )
  on conflict (endpoint) do update set
    user_id = excluded.user_id,
    p256dh_key = excluded.p256dh_key,
    auth_key = excluded.auth_key,
    platform = excluded.platform,
    user_agent = excluded.user_agent,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.register_push_subscription(text, text, text, text, text)
  from public, anon;
grant execute on function public.register_push_subscription(text, text, text, text, text)
  to authenticated;

create or replace function public.claim_due_daily_reminders(p_batch_size integer default 100)
returns table (user_id uuid, delivery_date date)
language sql
security definer
set search_path = ''
as $$
  with candidates as (
    select
      prefs.user_id,
      timezone(prefs.timezone, now()) as local_now,
      prefs.reminder_time
    from public.notification_preferences prefs
    join pg_catalog.pg_timezone_names timezone_names
      on timezone_names.name = prefs.timezone
    where prefs.enabled
      and exists (
        select 1 from public.push_subscriptions subscriptions
        where subscriptions.user_id = prefs.user_id
      )
  ), due as (
    select candidates.user_id, candidates.local_now::date as local_date
    from candidates
    left join public.notification_deliveries existing
      on existing.user_id = candidates.user_id
      and existing.delivery_date = candidates.local_now::date
      and existing.kind = 'daily_reminder'
    where candidates.local_now >= candidates.local_now::date + candidates.reminder_time
      and candidates.local_now < candidates.local_now::date + candidates.reminder_time + interval '30 minutes'
      and (
        existing.id is null
        or (
          existing.attempt_count < 3
          and (
            existing.status = 'failed'
            or (existing.status = 'processing' and existing.claimed_at < now() - interval '10 minutes')
          )
        )
      )
    order by candidates.user_id
    limit greatest(1, least(coalesce(p_batch_size, 100), 500))
  ), claimed as (
    insert into public.notification_deliveries as deliveries (
      user_id, delivery_date, kind, status, attempt_count, claimed_at
    )
    select due.user_id, due.local_date, 'daily_reminder', 'processing', 1, now()
    from due
    on conflict (user_id, delivery_date, kind) do update set
      status = 'processing',
      attempt_count = deliveries.attempt_count + 1,
      claimed_at = now(),
      last_error = null,
      updated_at = now()
    where deliveries.attempt_count < 3
      and (
        deliveries.status = 'failed'
        or (deliveries.status = 'processing' and deliveries.claimed_at < now() - interval '10 minutes')
      )
    returning deliveries.user_id, deliveries.delivery_date
  )
  select claimed.user_id, claimed.delivery_date from claimed;
$$;

revoke all on function public.claim_due_daily_reminders(integer)
  from public, anon, authenticated;
grant execute on function public.claim_due_daily_reminders(integer) to service_role;

drop trigger if exists notification_preferences_set_updated_at
  on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists push_subscriptions_set_updated_at
  on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists notification_deliveries_set_updated_at
  on public.notification_deliveries;
create trigger notification_deliveries_set_updated_at
  before update on public.notification_deliveries
  for each row execute function public.set_updated_at();

commit;
