-- Run this manually after deploying send-notifications and setting CRON_SECRET.
-- Replace both placeholders before executing in Supabase SQL Editor.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select vault.update_secret(
  id,
  'https://yyvrrfzvhrvecchzzmyt.supabase.co/functions/v1/send-notifications'
)
from vault.secrets
where name = 'notification_function_url';

select vault.create_secret(
  'https://yyvrrfzvhrvecchzzmyt.supabase.co/functions/v1/send-notifications',
  'notification_function_url'
)
where not exists (
  select 1 from vault.secrets where name = 'notification_function_url'
);

select vault.update_secret(id, 'YOUR_LONG_RANDOM_CRON_SECRET')
from vault.secrets
where name = 'notification_cron_secret';

select vault.create_secret('YOUR_LONG_RANDOM_CRON_SECRET', 'notification_cron_secret')
where not exists (
  select 1 from vault.secrets where name = 'notification_cron_secret'
);

select vault.update_secret(id, 'YOUR_SUPABASE_PUBLISHABLE_KEY')
from vault.secrets
where name = 'notification_publishable_key';

select vault.create_secret('YOUR_SUPABASE_PUBLISHABLE_KEY', 'notification_publishable_key')
where not exists (
  select 1 from vault.secrets where name = 'notification_publishable_key'
);

select cron.unschedule(jobid)
from cron.job
where jobname = 'send-daily-push-notifications';

select cron.schedule(
  'send-daily-push-notifications',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'notification_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey',
      (select decrypted_secret from vault.decrypted_secrets where name = 'notification_publishable_key'),
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notification_publishable_key'),
      'x-cron-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'notification_cron_secret')
    ),
    body := '{"mode":"daily"}'::jsonb
  );
  $$
);
