create extension if not exists pg_net;
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

do $$
declare
    existing_job_id bigint;
begin
    select jobid
    into existing_job_id
    from cron.job
    where jobname = 'refresh-market-prices';

    if existing_job_id is not null then
        perform cron.unschedule(existing_job_id);
    end if;

    -- Build the Edge Function URL from the configurable app setting so this
    -- migration works across environments (local / staging / production).
    -- Set app.settings.supabase_url in your Supabase project's Vault or via
    -- `ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<ref>.supabase.co';`
    -- Set app.settings.supabase_service_role_key for the Authorization header.
    -- NOTE: If app.settings.supabase_service_role_key is not set the cron job
    -- will be created but calls to the Edge Function will be rejected (401).
    -- Ensure the setting is configured before the job runs.
    perform cron.schedule(
        'refresh-market-prices',
        '*/5 * * * *',
        format(
            $job$
            select net.http_post(
                url := %L,
                headers := ('{"Content-Type":"application/json","Authorization":"Bearer ' ||
                    coalesce(nullif(current_setting('app.settings.supabase_service_role_key', true), ''), '') ||
                    '"}')::jsonb,
                body := '{"refreshTracked":true,"assetTypes":["equity","etf","index"],"timeframe":"1d","limit":25}'::jsonb,
                timeout_milliseconds := 15000
            ) as request_id;
            $job$,
            coalesce(
                nullif(current_setting('app.settings.supabase_url', true), ''),
                'https://bwcgciiwfkuskgfzkltc.supabase.co'
            ) || '/functions/v1/market-data-sync'
        )
    );
end $$;
