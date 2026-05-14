import type { NotificationPreference, SourceSeed } from "@/lib/types";

export const availableSubreddits: SourceSeed[] = [
  { subreddit_name: "productivity", priority: 100, is_active: true },
  { subreddit_name: "personalfinance", priority: 90, is_active: true },
  { subreddit_name: "entrepreneur", priority: 80, is_active: true },
  { subreddit_name: "investing", priority: 70, is_active: true },
  { subreddit_name: "technology", priority: 60, is_active: true },
  { subreddit_name: "health", priority: 50, is_active: true },
  { subreddit_name: "Futurology", priority: 40, is_active: true },
];

export const defaultSubredditPreferences = [
  "productivity",
  "personalfinance",
  "entrepreneur",
];

export const defaultNotificationPreferences: NotificationPreference[] = [
  {
    channelType: "rss",
    label: "Podcast RSS",
    isEnabled: true,
    helperText: "Use this feed in Apple Podcasts, Google Podcasts replacements, or any RSS app.",
    targetValue: "",
  },
  {
    channelType: "telegram",
    label: "Telegram bot",
    isEnabled: false,
    helperText: "Ready for bot delivery once you add the bot token and chat routing.",
    targetValue: "",
  },
];
