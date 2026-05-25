-- Scheduled per-user delivery bookkeeping + timezone on preferences.

alter table public.user_preferences
  add column if not exists timezone text not null default 'UTC';

create table if not exists public.delivery_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  run_date date not null,
  delivery_slot time without time zone not null,
  status text not null default 'queued',
  digest_id uuid references public.digests (id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  unique (user_id, run_date, delivery_slot)
);

create index if not exists delivery_runs_user_run_date_idx
  on public.delivery_runs (user_id, run_date desc);

alter table public.delivery_runs enable row level security;
