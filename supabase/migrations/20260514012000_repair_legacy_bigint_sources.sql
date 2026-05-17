-- Remote DB may already have public.sources from an older schema (id bigint).
-- Our app expects sources.id uuid. Drop legacy app tables so initial_schema can recreate them.

do $repair$
begin
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'sources'
      and c.column_name = 'id'
      and c.data_type in ('bigint', 'integer', 'smallint')
  ) then
    raise notice 'Repair: dropping legacy public tables (sources.id was not uuid)';

    drop table if exists public.delivery_runs cascade;
    drop table if exists public.digest_items cascade;
    drop table if exists public.digests cascade;
    drop table if exists public.digest_runs cascade;
    drop table if exists public.comments cascade;
    drop table if exists public.threads cascade;
    drop table if exists public.job_logs cascade;
    drop table if exists public.notification_channels cascade;
    drop table if exists public.user_subreddit_preferences cascade;
    drop table if exists public.user_preferences cascade;
    drop table if exists public.user_profile_settings cascade;
    drop table if exists public.sources cascade;
  end if;
end
$repair$;
