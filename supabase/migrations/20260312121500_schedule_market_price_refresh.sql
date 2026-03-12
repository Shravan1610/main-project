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

    perform cron.schedule(
        'refresh-market-prices',
        '*/5 * * * *',
        $job$
        select net.http_post(
            url := 'https://bwcgciiwfkuskgfzkltc.supabase.co/functions/v1/market-data-sync',
            headers := '{"Content-Type":"application/json"}'::jsonb,
            body := '{"refreshTracked":true,"assetTypes":["equity","etf","index"],"timeframe":"1d","limit":25}'::jsonb,
            timeout_milliseconds := 15000
        ) as request_id;
        $job$
    );
end $$;
