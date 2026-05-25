import { getServerEnv } from "@/lib/config";
import { filterRedditComments } from "@/lib/reddit/noise-filter";
import { calculateRankingScore } from "@/lib/ranking/score";

interface RedditListingChild<T> {
  data: T;
}

interface RedditListing<T> {
  data: {
    children: Array<RedditListingChild<T>>;
  };
}

export interface RedditThread {
  redditPostId: string;
  subredditName: string;
  title: string;
  selftext: string;
  authorName: string;
  permalink: string;
  url: string;
  score: number;
  numComments: number;
  createdUtc: number;
  rankingScore: number;
}

export interface RedditComment {
  redditCommentId: string;
  authorName: string;
  body: string;
  score: number;
  depth: number;
  isOp: boolean;
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getRedditAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const env = getServerEnv();
  const credentials = Buffer.from(
    `${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": env.REDDIT_USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Reddit token request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };

  return payload.access_token;
}

async function redditGet<T>(path: string) {
  const token = await getRedditAccessToken();
  const env = getServerEnv();

  const response = await fetch(`https://oauth.reddit.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": env.REDDIT_USER_AGENT,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Reddit API request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchTopThreads(subreddit: string, limit = 10) {
  const payload = await redditGet<RedditListing<{
    id: string;
    subreddit: string;
    title: string;
    selftext: string;
    author: string;
    permalink: string;
    url: string;
    score: number;
    num_comments: number;
    created_utc: number;
  }>>(`/r/${subreddit}/top?limit=${limit}&t=day`);

  return payload.data.children.map(({ data }) => ({
    redditPostId: data.id,
    subredditName: data.subreddit,
    title: data.title,
    selftext: data.selftext,
    authorName: data.author,
    permalink: `https://www.reddit.com${data.permalink}`,
    url: data.url,
    score: data.score,
    numComments: data.num_comments,
    createdUtc: data.created_utc,
    rankingScore: calculateRankingScore({
      score: data.score,
      numComments: data.num_comments,
      ageHours: Math.max(0, (Date.now() / 1000 - data.created_utc) / 3600),
      selfTextLength: data.selftext.length,
    }),
  }));
}

export async function fetchThreadComments(postId: string, limit = 25) {
  const payload = await redditGet<
    [
      RedditListing<Record<string, never>>,
      RedditListing<{
        id: string;
        author: string;
        body: string;
        score: number;
        depth: number;
        is_submitter: boolean;
      }>
    ]
  >(`/comments/${postId}?sort=top&limit=${limit}`);

  const rawComments = payload[1].data.children.map(({ data }) => ({
    redditCommentId: data.id,
    authorName: data.author,
    body: data.body,
    score: data.score,
    depth: data.depth,
    isOp: data.is_submitter,
  }));

  return filterRedditComments(
    rawComments.filter((comment) => comment.body && comment.body.length >= 50),
    limit,
  );
}

export function parseRedditPostReference(input: string) {
  const trimmed = input.trim();

  const directIdMatch = trimmed.match(/^[a-z0-9]{5,8}$/i);
  if (directIdMatch) {
    return { postId: directIdMatch[0] };
  }

  const urlMatch = trimmed.match(
    /reddit\.com\/r\/([^/]+)\/comments\/([a-z0-9]+)(?:\/([^/?#]+))?/i,
  );

  if (urlMatch) {
    return {
      subreddit: urlMatch[1],
      postId: urlMatch[2],
      slug: urlMatch[3],
    };
  }

  return null;
}

function mapRedditPost(data: {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  permalink: string;
  url: string;
  score: number;
  num_comments: number;
  created_utc: number;
}): RedditThread {
  return {
    redditPostId: data.id,
    subredditName: data.subreddit,
    title: data.title,
    selftext: data.selftext,
    authorName: data.author,
    permalink: `https://www.reddit.com${data.permalink}`,
    url: data.url,
    score: data.score,
    numComments: data.num_comments,
    createdUtc: data.created_utc,
    rankingScore: calculateRankingScore({
      score: data.score,
      numComments: data.num_comments,
      ageHours: Math.max(0, (Date.now() / 1000 - data.created_utc) / 3600),
      selfTextLength: data.selftext.length,
    }),
  };
}

export async function fetchThreadById(postId: string) {
  const payload = await redditGet<
    [
      RedditListing<{
        id: string;
        subreddit: string;
        title: string;
        selftext: string;
        author: string;
        permalink: string;
        url: string;
        score: number;
        num_comments: number;
        created_utc: number;
      }>,
      RedditListing<Record<string, never>>,
    ]
  >(`/comments/${postId}?sort=top&limit=1`);

  const post = payload[0]?.data?.children?.[0]?.data;
  if (!post) {
    throw new Error(`Reddit post ${postId} was not found.`);
  }

  return mapRedditPost(post);
}

export async function fetchThreadByReference(reference: string) {
  const parsed = parseRedditPostReference(reference);
  if (!parsed) {
    throw new Error("Provide a valid Reddit post URL or post id.");
  }

  return fetchThreadById(parsed.postId);
}
