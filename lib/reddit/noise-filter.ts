import type { RedditComment } from "@/lib/reddit/client";

const BOT_AUTHORS = new Set(["automoderator", "bot", "reddit", "[deleted]"]);

const NOISE_PATTERNS = [
  /^(this|same|\+1|lol|lmao|yep|nope|agreed?|true|facts|underrated comment|take my upvote)\.?$/i,
  /^[\p{Emoji}\s]+$/u,
  /^!thanks|^!delta/i,
  /^edit:/i,
  /^removed|^deleted/i,
];

const FLAME_PATTERNS = [
  /\b(idiot|moron|stupid|dumb|kill yourself|kys)\b/i,
  /\b(shut up|go away|touch grass)\b/i,
];

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isNoiseBody(body: string) {
  const trimmed = body.trim();
  if (!trimmed || trimmed === "[deleted]" || trimmed === "[removed]") {
    return true;
  }

  if (wordCount(trimmed) < 5) {
    return true;
  }

  return NOISE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isFlameBody(body: string) {
  return FLAME_PATTERNS.some((pattern) => pattern.test(body));
}

function commentQualityScore(comment: RedditComment) {
  const words = wordCount(comment.body);
  let score = comment.score * 0.4;

  if (comment.isOp) {
    score += 8;
  }

  if (words >= 40) {
    score += 12;
  } else if (words >= 20) {
    score += 6;
  }

  if (/\d/.test(comment.body)) {
    score += 4;
  }

  if (/\b(i tried|we tried|in my experience|what worked|step \d|here'?s how)\b/i.test(comment.body)) {
    score += 10;
  }

  if (/\b(https?:\/\/|www\.)\S+/i.test(comment.body)) {
    score += 3;
  }

  if (comment.depth > 0) {
    score += 2;
  }

  return score;
}

export function filterRedditComments(comments: RedditComment[], limit: number) {
  const cleaned = comments.filter((comment) => {
    const author = comment.authorName.toLowerCase();
    if (BOT_AUTHORS.has(author) || author.endsWith("bot")) {
      return false;
    }

    if (isNoiseBody(comment.body) || isFlameBody(comment.body)) {
      return false;
    }

    return true;
  });

  return cleaned
    .sort((left, right) => commentQualityScore(right) - commentQualityScore(left))
    .slice(0, limit);
}

export function hashCommentSample(comments: RedditComment[]) {
  const payload = comments
    .map((comment) => `${comment.redditCommentId}:${comment.score}:${comment.body.length}`)
    .join("|");

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}
