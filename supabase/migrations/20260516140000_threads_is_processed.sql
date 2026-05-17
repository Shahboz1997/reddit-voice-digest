alter table public.threads
  add column if not exists is_processed boolean not null default false,
  add column if not exists processed_at timestamptz null;

create index if not exists threads_unprocessed_idx
  on public.threads (is_processed, ingested_at desc)
  where is_processed = false;

comment on column public.threads.is_processed is
  'True after this Reddit post was included in a completed digest — skip on future pipeline runs.';
