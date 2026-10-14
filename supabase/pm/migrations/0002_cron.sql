-- 0002_cron.sql: the scheduled jobs (06 · Cron), with pg_cron and pg_net.
--
-- The extensions are project-wide, and lumina may already use them, so this migration never
-- creates or alters them: the owner switches them on in Database › Extensions first. The jobs call
-- the `pm-` functions with two Vault secrets, which the owner adds in Project Settings › Vault:
--   pm_service_role_key  the service-role key (06 · Cron)
--   pm_project_url       https://<project-ref>.supabase.co (public, but kept out of the repo)
-- Job names start with `pm-`, so they're easy to tell from lumina's in `cron.job`.

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron')
     or not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise exception 'Switch on pg_cron and pg_net in Database > Extensions, then run db:migrate again (06 · Cron).';
  end if;
end;
$$;

-- Calls one `pm-` Edge Function with the service-role key from Vault. Runs as its owner (the
-- migration role, which also owns the cron jobs); nobody else may execute it.
create function pm.invoke_function(fn text, body jsonb default '{}'::jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  base text;
  key text;
begin
  if fn !~ '^pm-[a-z-]+$' then
    raise exception 'Not a pm- function: %', fn;
  end if;
  select decrypted_secret into base from vault.decrypted_secrets where name = 'pm_project_url';
  select decrypted_secret into key from vault.decrypted_secrets where name = 'pm_service_role_key';
  if base is null or key is null then
    raise exception 'Add pm_project_url and pm_service_role_key in Vault (06 · Cron).';
  end if;
  return net.http_post(
    url := rtrim(base, '/') || '/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || key),
    body := body,
    timeout_milliseconds := 30000
  );
end;
$$;
revoke all on function pm.invoke_function(text, jsonb) from public, anon, authenticated, service_role;

select cron.schedule('pm-scheduled-posts', '*/5 * * * *', $job$select pm.invoke_function('pm-post-scheduler')$job$);
select cron.schedule('pm-link-check', '23 2 * * *', $job$select pm.invoke_function('pm-check-link', '{"nightly":true}'::jsonb)$job$);
select cron.schedule('pm-purge', '17 3 * * *', $job$select pm.invoke_function('pm-purge')$job$);
