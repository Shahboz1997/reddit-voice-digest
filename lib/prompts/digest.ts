import type { PersonaId, SummaryDepthId } from "@/lib/types";

import {
  depthScriptWordRange,
  depthThreadSummaryPromptAddition,
  personaScriptPromptAddition,
  personaThreadPromptAddition,
} from "@/lib/digest-persona";

export const REDDIT_NOISE_FILTER_RULES = `
Noise filter (apply before summarizing):
- Ignore comments shorter than 5 words (e.g. "this", "lol", "+1", emoji-only).
- Ignore branches that are mostly insults, empty sarcasm, pile-ons, or obvious bot/spam patterns.
- Prioritize only: practical advice, specific numbers or metrics, first-hand experience ("I tried…", "we shipped…"), and links to tools or resources.
- Drop flamewars even if highly upvoted; witty lines count only if they carry a concrete takeaway.
`.trim();

export function buildThreadSummaryPrompt(input: {
  subreddit: string;
  title: string;
  body: string;
  comments: string[];
  persona?: PersonaId;
  summaryDepth?: SummaryDepthId;
}) {
  const persona = input.persona ?? "news_anchor";
  const depth = input.summaryDepth ?? "standard";

  return `
You are creating a short practical digest from a Reddit thread.

Return JSON with:
- why_it_matters
- summary
- key_takeaways (array of 3 strings)

Rules:
${REDDIT_NOISE_FILTER_RULES}
- Prefer repeated consensus and concrete trade-offs over hot takes.
- Apply the narrator voice described below.${depth === "deep" ? "\n- You may cite one standout comment line indirectly (no usernames)." : ""}

${personaThreadPromptAddition(persona)}
${depthThreadSummaryPromptAddition(depth)}

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
    /** Editorial hint: first thread gets proportionally more airtime in the narration. */
    segmentWeightPrimary?: boolean;
    approxSecondsBudget?: number;
  }>;
  persona?: PersonaId;
  summaryDepth?: SummaryDepthId;
}) {
  const persona = input.persona ?? "news_anchor";
  const depth = input.summaryDepth ?? "standard";
  const { min: minWords, max: maxWords } = depthScriptWordRange(depth);

  const threadBlock = input.items
    .map(
      (item, index) => `
${index + 1}. ${item.title} (${item.subreddit})
${item.segmentWeightPrimary ? `[PRIMARY SEGMENT ~${item.approxSecondsBudget ?? "?"}s in the episode]` : `[supporting segment ~${item.approxSecondsBudget ?? "?"}s]`}
Why it matters: ${item.whyItMatters}
Summary: ${item.summary}
Key takeaways: ${item.keyTakeaways.join("; ")}
`,
    )
    .join("\n");

  return `
Write a polished podcast script in English for a show called "Reddit Voice Digest".

Output JSON with:
- digest_title
- intro
- closing
- full_script

${personaScriptPromptAddition(persona)}

Requirements:
- Target ${minWords}–${maxWords} words total in full_script (across intro, body segments, closing).
- Structure each segment as: hook, distilled insight, lightweight trade-offs.
- Use audible transitions between threads.
- Reflect the pacing implied by PRIMARY vs supporting segments above (more detail on PRIMARY).
- Keep signal over drama: practical steps, numbers, lived experience, and tool mentions beat jokes or meta-arguments.
- Avoid filler and avoid referencing upvotes directly.

Date: ${input.dateLabel}

Thread summaries:
${threadBlock}
`.trim();
}
