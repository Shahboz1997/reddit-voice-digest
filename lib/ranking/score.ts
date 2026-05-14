import type { RankedThreadInput } from "@/lib/types";

export function calculateRankingScore(input: RankedThreadInput) {
  const scoreWeight = input.score * 0.5;
  const commentsWeight = input.numComments * 0.8;
  const freshnessBonus = Math.max(0, 36 - input.ageHours) * 2;
  const textBonus = Math.min(input.selfTextLength / 400, 10);

  return Number(
    (scoreWeight + commentsWeight + freshnessBonus + textBonus).toFixed(2),
  );
}
