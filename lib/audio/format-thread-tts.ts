export function formatThreadSegmentForTts(input: {
  title: string;
  subreddit: string;
  whyItMatters: string;
  summary: string;
  keyTakeaways: string[];
  segmentWeightPrimary?: boolean;
}) {
  const lead = input.segmentWeightPrimary ? "Our lead story today." : "Next up.";
  const takeaways =
    input.keyTakeaways.length > 0
      ? `Key takeaways: ${input.keyTakeaways.join(". ")}.`
      : "";

  return [
    lead,
    `From r slash ${input.subreddit.replace(/^r\//i, "")}: ${input.title}.`,
    input.whyItMatters,
    input.summary,
    takeaways,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}
