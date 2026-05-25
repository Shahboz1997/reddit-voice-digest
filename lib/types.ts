export type DigestStatus = "queued" | "processing" | "completed" | "failed";
export type NotificationChannelType = "telegram" | "rss";
export type PersonaId = "bro_investor" | "scholar" | "news_anchor";
export type SummaryDepthId = "short" | "standard" | "deep";

export interface DigestChapter {
  id: string;
  label: string;
  startSeconds: number;
  endSeconds: number;
  summary: string;
}

export interface DigestItem {
  id: string;
  threadTitle: string;
  subredditName: string;
  whyItMatters: string;
  summary: string;
  keyTakeaways: string[];
  tldrPoints: string[];
  startSeconds: number;
  endSeconds: number;
  redditThreadUrl: string;
  redditCommentUrl?: string;
  commentCtaLabel?: string;
}

export interface DigestEpisode {
  id: string;
  slug: string;
  title: string;
  summary: string;
  introText: string;
  transcriptText: string;
  audioUrl?: string;
  publishedAt: string;
  durationSeconds: number;
  durationLabel: string;
  topics: string[];
  keyThoughts: string[];
  chapters: DigestChapter[];
  items: DigestItem[];
}

export interface SourceSeed {
  subreddit_name: string;
  priority: number;
  is_active: boolean;
}

export interface RankedThreadInput {
  score: number;
  numComments: number;
  ageHours: number;
  selfTextLength: number;
}

export interface NotificationPreference {
  channelType: NotificationChannelType;
  label: string;
  isEnabled: boolean;
  targetValue?: string;
  helperText: string;
}

export interface UserDigestPreferences {
  subreddits: string[];
  notifications: NotificationPreference[];
  persona: PersonaId;
  summaryDepth: SummaryDepthId;
  deliveryLocalTime: string | null;
  deliveryWeekdaysOnly: boolean;
  timezone?: string;
  /** null = ElevenLabs voice follows persona default from catalog */
  elevenlabsVoiceId?: string | null;
  personalRssUrl?: string | null;
}
