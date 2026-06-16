import type { SourceSeed } from "@/lib/types";

export type SubredditCategoryId =
  | "growth"
  | "tools"
  | "finance"
  | "tech"
  | "health"
  | "science"
  | "learn"
  | "news"
  | "lifestyle";

export interface SubredditCategory {
  id: SubredditCategoryId;
  title: string;
  color: string;
}

export const SUBREDDIT_CATEGORIES: SubredditCategory[] = [
  { id: "growth", title: "Growth & discipline", color: "#5038a0" },
  { id: "tools", title: "Tools & workflows", color: "#27856a" },
  { id: "finance", title: "Money & business", color: "#8d6708" },
  { id: "tech", title: "Technology", color: "#1e3264" },
  { id: "health", title: "Health & wellness", color: "#ba5d07" },
  { id: "science", title: "Science & future", color: "#477d95" },
  { id: "learn", title: "Learn & ask", color: "#e6618b" },
  { id: "news", title: "News & career", color: "#b02897" },
  { id: "lifestyle", title: "Culture & fun", color: "#dc148c" },
];

const CATEGORY_BY_ID = new Map(SUBREDDIT_CATEGORIES.map((row) => [row.id, row]));

const SUBREDDIT_TO_CATEGORY: Record<string, SubredditCategoryId> = {
  productivity: "growth",
  lifeprotips: "growth",
  getdisciplined: "growth",
  getmotivated: "growth",
  selfimprovement: "growth",
  decidingtobebetter: "growth",
  notion: "tools",
  todoist: "tools",
  personalfinance: "finance",
  entrepreneur: "finance",
  investing: "finance",
  stocks: "finance",
  startups: "finance",
  technology: "tech",
  programming: "tech",
  webdev: "tech",
  machinelearning: "tech",
  datascience: "tech",
  learnprogramming: "tech",
  apple: "tech",
  android: "tech",
  health: "health",
  fitness: "health",
  nutrition: "health",
  mentalhealth: "health",
  futurology: "science",
  science: "science",
  space: "science",
  askscience: "science",
  todayilearned: "learn",
  explainlikeimfive: "learn",
  askreddit: "learn",
  nostupidquestions: "learn",
  worldnews: "news",
  news: "news",
  jobs: "news",
  books: "lifestyle",
  gaming: "lifestyle",
  funny: "lifestyle",
  aww: "lifestyle",
};

export function getSubredditCategoryId(name: string): SubredditCategoryId {
  return SUBREDDIT_TO_CATEGORY[name.toLowerCase()] ?? "lifestyle";
}

export function getSubredditCategory(name: string): SubredditCategory {
  const id = getSubredditCategoryId(name);
  return CATEGORY_BY_ID.get(id) ?? SUBREDDIT_CATEGORIES[SUBREDDIT_CATEGORIES.length - 1];
}

export function groupSourcesByCategory(sources: SourceSeed[]) {
  const buckets = new Map<SubredditCategoryId, SourceSeed[]>();

  for (const category of SUBREDDIT_CATEGORIES) {
    buckets.set(category.id, []);
  }

  for (const source of sources) {
    const id = getSubredditCategoryId(source.subreddit_name);
    buckets.get(id)?.push(source);
  }

  return SUBREDDIT_CATEGORIES.map((category) => ({
    category,
    sources: buckets.get(category.id) ?? [],
  })).filter((row) => row.sources.length > 0);
}
