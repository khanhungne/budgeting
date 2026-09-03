-- Run this manually after deploying send-notifications and setting CRON_SECRET.
-- Replace the CRON secret placeholder before executing in Supabase SQL Editor.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  'https://yyvrrfzvhrvecchzzmyt.supabase.co/functions/v1/send-notifications',
  'notification_function_url'
);

select vault.create_secret('YOUR_LONG_RANDOM_CRON_SECRET', 'notification_cron_secret');

select cron.schedule(
  'send-daily-push-notifications',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'notification_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'notification_cron_secret')
    ),
    body := '{"mode":"daily"}'::jsonb
  );
  $$
);
