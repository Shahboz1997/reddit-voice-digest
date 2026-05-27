import type { NotificationPreference, SourceSeed } from "@/lib/types";

export const availableSubreddits: SourceSeed[] = [
  { subreddit_name: "productivity", priority: 100, is_active: true },
  { subreddit_name: "LifeProTips", priority: 95, is_active: true },
  { subreddit_name: "GetDisciplined", priority: 90, is_active: true },
  { subreddit_name: "GetMotivated", priority: 88, is_active: true },
  { subreddit_name: "selfimprovement", priority: 86, is_active: true },
  { subreddit_name: "DecidingToBeBetter", priority: 84, is_active: true },
  { subreddit_name: "Notion", priority: 85, is_active: true },
  { subreddit_name: "personalfinance", priority: 80, is_active: true },
  { subreddit_name: "entrepreneur", priority: 75, is_active: true },
  { subreddit_name: "investing", priority: 70, is_active: true },
  { subreddit_name: "stocks", priority: 68, is_active: true },
  { subreddit_name: "startups", priority: 66, is_active: true },
  { subreddit_name: "technology", priority: 65, is_active: true },
  { subreddit_name: "programming", priority: 63, is_active: true },
  { subreddit_name: "webdev", priority: 61, is_active: true },
  { subreddit_name: "todoist", priority: 60, is_active: true },
  { subreddit_name: "MachineLearning", priority: 59, is_active: true },
  { subreddit_name: "datascience", priority: 57, is_active: true },
  { subreddit_name: "learnprogramming", priority: 56, is_active: true },
  { subreddit_name: "health", priority: 55, is_active: true },
  { subreddit_name: "apple", priority: 54, is_active: true },
  { subreddit_name: "Android", priority: 53, is_active: true },
  { subreddit_name: "Futurology", priority: 50, is_active: true },
  { subreddit_name: "fitness", priority: 49, is_active: true },
  { subreddit_name: "science", priority: 48, is_active: true },
  { subreddit_name: "nutrition", priority: 47, is_active: true },
  { subreddit_name: "space", priority: 46, is_active: true },
  { subreddit_name: "mentalhealth", priority: 45, is_active: true },
  { subreddit_name: "askscience", priority: 44, is_active: true },
  { subreddit_name: "todayilearned", priority: 42, is_active: true },
  { subreddit_name: "explainlikeimfive", priority: 40, is_active: true },
  { subreddit_name: "AskReddit", priority: 38, is_active: true },
  { subreddit_name: "NoStupidQuestions", priority: 36, is_active: true },
  { subreddit_name: "worldnews", priority: 34, is_active: true },
  { subreddit_name: "news", priority: 32, is_active: true },
  { subreddit_name: "jobs", priority: 30, is_active: true },
  { subreddit_name: "books", priority: 28, is_active: true },
  { subreddit_name: "gaming", priority: 26, is_active: true },
  { subreddit_name: "funny", priority: 24, is_active: true },
  { subreddit_name: "aww", priority: 22, is_active: true },
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
