-- Required after 20260902_daily_push_notifications.sql was applied without
-- explicit table grants. Row-level security policies still restrict users to
-- their own notification data.

begin;

grant select, insert, update, delete on table public.notification_preferences to authenticated;
grant select, delete on table public.push_subscriptions to authenticated;

grant all privileges on table public.notification_preferences to service_role;
grant all privileges on table public.push_subscriptions to service_role;
grant all privileges on table public.notification_deliveries to service_role;

commit;
