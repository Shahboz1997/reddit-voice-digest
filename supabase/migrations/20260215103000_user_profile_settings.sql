-- Subreddit preference order for drag-and-drop priority
alter table public.user_subreddit_preferences
add column if not exists sort_order integer not null default 0;

-- Persona / depth / delivery + stable personal RSS token
create table if not exists public.user_profile_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rss_feed_token uuid not null default gen_random_uuid () unique,
  persona text not null default 'news_anchor' check (
    persona in ('bro_investor', 'scholar', 'news_anchor')
  ),
  summary_depth text not null default 'standard' check (
    summary_depth in ('short', 'standard', 'deep')
  ),
  delivery_local_time text null,
  delivery_weekdays_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profile_settings_rss_feed_token_idx on public.user_profile_settings (rss_feed_token);

alter table public.user_profile_settings enable row level security;

create policy "user_profile_select" on public.user_profile_settings for select to authenticated using ((select auth.uid()) = user_id);

create policy "user_profile_insert" on public.user_profile_settings for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "user_profile_update" on public.user_profile_settings for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select,
  insert,
  update on table public.user_profile_settings to authenticated;
