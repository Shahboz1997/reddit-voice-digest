insert into public.sources (subreddit_name, priority, is_active)
values
  ('productivity', 100, true),
  ('personalfinance', 90, true),
  ('entrepreneur', 80, true),
  ('investing', 70, true),
  ('technology', 60, true),
  ('health', 50, true),
  ('Futurology', 40, true)
on conflict (subreddit_name) do update
set
  priority = excluded.priority,
  is_active = excluded.is_active;
