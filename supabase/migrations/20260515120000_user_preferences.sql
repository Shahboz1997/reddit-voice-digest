-- Canonical app preferences: ordered subreddit list, delivery window, narrator voice ("persona" id kept in `voice`).
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  selected_subreddits text[] not null default '{}'::text[],
  delivery_local_time time without time zone null,
  voice text not null default 'news_anchor' check (
    voice in ('bro_investor', 'scholar', 'news_anchor')
  ),
  summary_depth text not null default 'standard' check (
    summary_depth in ('short', 'standard', 'deep')
  ),
  delivery_weekdays_only boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists user_preferences_user_id_idx on public.user_preferences (user_id);

alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own"
on public.user_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "user_preferences_insert_own"
on public.user_preferences
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "user_preferences_update_own"
on public.user_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.user_preferences to authenticated;
