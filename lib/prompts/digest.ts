export function buildThreadSummaryPrompt(input: {
  subreddit: string;
  title: string;
  body: string;
  comments: string[];
}) {
  return `
You are creating a short practical digest from a Reddit thread.

Return JSON with:
- why_it_matters
- summary
- key_takeaways (array of 3 strings)

Rules:
- Remove jokes, flamewars, and repetitive comments.
- Prefer practical advice, concrete trade-offs, and repeated consensus.
- Keep the tone clean and editorial, not conversational.

Subreddit: ${input.subreddit}
Title: ${input.title}
Body:
${input.body}

Selected comments:
${input.comments.map((comment, index) => `${index + 1}. ${comment}`).join("\n")}
`.trim();
}

export function buildDigestScriptPrompt(input: {
  dateLabel: string;
  items: Array<{
    title: string;
    subreddit: string;
    whyItMatters: string;
    summary: string;
    keyTakeaways: string[];
  }>;
}) {
  return `
Write a polished five-minute podcast script in English for a show called "Reddit Voice Digest".

Output JSON with:
- digest_title
- intro
- closing
- full_script

Requirements:
- 600 to 700 words total.
- Structure each segment as: Question, best solutions, trade-offs.
- Sound clear and concise, like a short professional podcast.
- Use transitions between threads.
- Avoid filler and avoid referencing upvotes directly.

Date: ${input.dateLabel}

Thread summaries:
${input.items
  .map(
    (item, index) => `
${index + 1}. ${item.title} (${item.subreddit})
Why it matters: ${item.whyItMatters}
Summary: ${item.summary}
Key takeaways: ${item.keyTakeaways.join("; ")}
`,
  )
  .join("\n")}
`.trim();
}
