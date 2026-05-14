create extension if not exists pgcrypto;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  subreddit_name text not null unique,
  is_active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_subreddit_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subreddit_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, subreddit_name)
);

create table if not exists public.notification_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel_type text not null check (channel_type in ('telegram', 'rss')),
  target_value text not null default '',
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, channel_type)
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  reddit_post_id text not null unique,
  source_id uuid references public.sources (id) on delete set null,
  title text not null,
  author_name text,
  subreddit_name text not null,
  url text not null,
  permalink text not null,
  score integer not null default 0,
  num_comments integer not null default 0,
  created_utc timestamptz not null,
  selftext text not null default '',
  raw_json jsonb not null default '{}'::jsonb,
  ranking_score numeric(10, 2) not null default 0,
  ingested_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  reddit_comment_id text not null unique,
  parent_reddit_id text,
  author_name text,
  body text not null,
  score integer not null default 0,
  depth integer not null default 0,
  is_op boolean not null default false,
  raw_json jsonb not null default '{}'::jsonb,
  selected_for_summary boolean not null default false,
  ingested_at timestamptz not null default now()
);

create table if not exists public.digest_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null unique,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create table if not exists public.digests (
  id uuid primary key default gen_random_uuid(),
  digest_run_id uuid references public.digest_runs (id) on delete set null,
  owner_user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  slug text not null unique,
  intro_text text not null default '',
  summary_text text not null default '',
  script_text text not null default '',
  transcript_text text not null default '',
  topics jsonb not null default '[]'::jsonb,
  audio_url text,
  audio_storage_path text,
  duration_seconds integer,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.digest_items (
  id uuid primary key default gen_random_uuid(),
  digest_id uuid not null references public.digests (id) on delete cascade,
  thread_id uuid references public.threads (id) on delete set null,
  position integer not null,
  thread_summary text not null,
  key_takeaways jsonb not null default '[]'::jsonb,
  tldr_points jsonb not null default '[]'::jsonb,
  why_it_matters text not null,
  reddit_thread_url text,
  reddit_comment_url text,
  audio_start_seconds integer not null default 0,
  audio_end_seconds integer,
  created_at timestamptz not null default now(),
  unique (digest_id, position)
);

create table if not exists public.job_logs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  error_text text,
  created_at timestamptz not null default now()
);

create index if not exists threads_subreddit_name_idx on public.threads (subreddit_name);
create index if not exists threads_ranking_score_idx on public.threads (ranking_score desc);
create index if not exists comments_thread_id_idx on public.comments (thread_id);
create index if not exists user_subreddit_preferences_user_id_idx on public.user_subreddit_preferences (user_id);
create index if not exists notification_channels_user_id_idx on public.notification_channels (user_id);
create index if not exists digest_runs_run_date_idx on public.digest_runs (run_date desc);
create index if not exists digests_published_at_idx on public.digests (published_at desc);
create index if not exists digests_owner_user_id_idx on public.digests (owner_user_id);
create index if not exists job_logs_job_name_idx on public.job_logs (job_name, created_at desc);

alter table public.sources enable row level security;
alter table public.threads enable row level security;
alter table public.comments enable row level security;
alter table public.user_subreddit_preferences enable row level security;
alter table public.notification_channels enable row level security;
alter table public.digest_runs enable row level security;
alter table public.digests enable row level security;
alter table public.digest_items enable row level security;
alter table public.job_logs enable row level security;

create policy "public can read active sources"
on public.sources
for select
using (is_active = true);

create policy "users can read own subreddit preferences"
on public.user_subreddit_preferences
for select
using ((select auth.uid()) = user_id);

create policy "users can insert own subreddit preferences"
on public.user_subreddit_preferences
for insert
with check ((select auth.uid()) = user_id);

create policy "users can delete own subreddit preferences"
on public.user_subreddit_preferences
for delete
using ((select auth.uid()) = user_id);

create policy "users can read own notification channels"
on public.notification_channels
for select
using ((select auth.uid()) = user_id);

create policy "users can insert own notification channels"
on public.notification_channels
for insert
with check ((select auth.uid()) = user_id);

create policy "users can update own notification channels"
on public.notification_channels
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own notification channels"
on public.notification_channels
for delete
using ((select auth.uid()) = user_id);

create policy "public can read published public digests"
on public.digests
for select
using (published_at is not null and owner_user_id is null);

create policy "users can read own personalized digests"
on public.digests
for select
using ((select auth.uid()) = owner_user_id);

create policy "public can read published public digest items"
on public.digest_items
for select
using (
  exists (
    select 1
    from public.digests
    where public.digests.id = digest_items.digest_id
      and public.digests.published_at is not null
      and public.digests.owner_user_id is null
  )
);

create policy "users can read own personalized digest items"
on public.digest_items
for select
using (
  exists (
    select 1
    from public.digests
    where public.digests.id = digest_items.digest_id
      and public.digests.owner_user_id = (select auth.uid())
  )
);
