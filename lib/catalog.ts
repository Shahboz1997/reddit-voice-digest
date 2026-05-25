import type { NotificationPreference, SourceSeed } from "@/lib/types";

export const availableSubreddits: SourceSeed[] = [
  { subreddit_name: "productivity", priority: 100, is_active: true },
  { subreddit_name: "LifeProTips", priority: 95, is_active: true },
  { subreddit_name: "GetDisciplined", priority: 90, is_active: true },
  { subreddit_name: "Notion", priority: 85, is_active: true },
  { subreddit_name: "personalfinance", priority: 80, is_active: true },
  { subreddit_name: "entrepreneur", priority: 75, is_active: true },
  { subreddit_name: "investing", priority: 70, is_active: true },
  { subreddit_name: "technology", priority: 65, is_active: true },
  { subreddit_name: "todoist", priority: 60, is_active: true },
  { subreddit_name: "health", priority: 55, is_active: true },
  { subreddit_name: "Futurology", priority: 50, is_active: true },
];

export const defaultSubredditPreferences = [
  "productivity",
  "LifeProTips",
  "GetDisciplined",
];

export const defaultNotificationPreferences: NotificationPreference[] = [
  {
    channelType: "rss",
    label: "Podcast RSS",
    isEnabled: true,
    helperText:
      "Paste your personal RSS URL into Apple Podcasts, Spotify “Add by RSS”, Pocket Casts, or Overcast.",
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
