import type { RedditComment, RedditThread } from "@/lib/reddit/client";
import { calculateRankingScore } from "@/lib/ranking/score";

export interface ThreadQualityInput {
  thread: RedditThread;
  comments?: RedditComment[];
}

const MIN_QUALITY_SCORE = 45;

function engagementRatio(thread: RedditThread) {
  if (thread.numComments <= 0) {
    return 0;
  }

  return thread.score / thread.numComments;
}

function commentSignalScore(comments: RedditComment[]) {
  if (!comments.length) {
    return 0;
  }

  const substantive = comments.filter((comment) => comment.body.trim().split(/\s+/).length >= 20);
  const substantiveRatio = substantive.length / comments.length;
  const avgScore = comments.reduce((sum, comment) => sum + comment.score, 0) / comments.length;

  return substantiveRatio * 25 + Math.min(avgScore * 0.15, 15);
}

export function calculateThreadQualityScore(input: ThreadQualityInput) {
  const { thread, comments = [] } = input;
  const base = calculateRankingScore({
    score: thread.score,
    numComments: thread.numComments,
    ageHours: Math.max(0, (Date.now() / 1000 - thread.createdUtc) / 3600),
    selfTextLength: thread.selftext.length,
  });

  const engagementBonus = Math.min(engagementRatio(thread) * 4, 20);
  const commentBonus = commentSignalScore(comments);
  const opContextBonus = thread.selftext.trim().length >= 120 ? 8 : 0;

  return Number((base + engagementBonus + commentBonus + opContextBonus).toFixed(2));
}

export function passesThreadQualityGate(input: ThreadQualityInput, minScore = MIN_QUALITY_SCORE) {
  return calculateThreadQualityScore(input) >= minScore;
}

export function rankThreadsByQuality(
  threads: RedditThread[],
  commentsByPostId: Map<string, RedditComment[]>,
) {
  return [...threads].sort((left, right) => {
    const leftScore = calculateThreadQualityScore({
      thread: left,
      comments: commentsByPostId.get(left.redditPostId),
    });
    const rightScore = calculateThreadQualityScore({
      thread: right,
      comments: commentsByPostId.get(right.redditPostId),
    });

    return rightScore - leftScore;
  });
}
