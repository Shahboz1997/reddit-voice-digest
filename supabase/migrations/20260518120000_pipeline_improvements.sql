-- Per-user digest runs, summary cache, and async pipeline jobs.

alter table public.digest_runs
  add column if not exists owner_user_id uuid references auth.users (id) on delete cascade;

alter table public.digest_runs
  drop constraint if exists digest_runs_run_date_key;

create unique index if not exists digest_runs_public_run_date_uidx
  on public.digest_runs (run_date)
  where owner_user_id is null;

create unique index if not exists digest_runs_owner_run_date_uidx
  on public.digest_runs (run_date, owner_user_id)
  where owner_user_id is not null;

create index if not exists digest_runs_owner_user_id_idx
  on public.digest_runs (owner_user_id, run_date desc);

create table if not exists public.thread_summary_cache (
  id uuid primary key default gen_random_uuid(),
  reddit_post_id text not null,
  persona text not null,
  summary_depth text not null,
  content_hash text not null,
  why_it_matters text not null,
  summary text not null,
  key_takeaways jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reddit_post_id, persona, summary_depth, content_hash)
);

create index if not exists thread_summary_cache_lookup_idx
  on public.thread_summary_cache (reddit_post_id, persona, summary_depth, content_hash);

create table if not exists public.pipeline_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists pipeline_jobs_status_created_idx
  on public.pipeline_jobs (status, created_at asc);

create index if not exists pipeline_jobs_owner_idx
  on public.pipeline_jobs (owner_user_id, created_at desc);

alter table public.thread_summary_cache enable row level security;
alter table public.pipeline_jobs enable row level security;

create policy "service role manages thread summary cache"
  on public.thread_summary_cache
  for all
  using (true)
  with check (true);

create policy "users read own pipeline jobs"
  on public.pipeline_jobs
  for select
  using (auth.uid() = owner_user_id);

create policy "service role manages pipeline jobs"
  on public.pipeline_jobs
  for all
  using (true)
  with check (true);
