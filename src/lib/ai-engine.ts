import OpenAI from "openai";

import { getServerEnv, resolveOpenAiScriptModel } from "@/lib/config";
import {
  depthScriptWordRange,
  personaScriptPromptAddition,
} from "@/lib/digest-persona";
import { REDDIT_NATIVE_SCRIPT_SECTIONS, REDDIT_NOISE_FILTER_RULES } from "@/lib/prompts/digest";
import type { PersonaId, SummaryDepthId } from "@/lib/types";

export type DialogueSpeaker = "host_a" | "host_b";

export interface DialogueTurn {
  speaker: DialogueSpeaker;
  text: string;
  /** Which Reddit thread segment (0-based) this line belongs to. */
  threadIndex?: number;
}

export interface DialogueDigestScript {
  digest_title: string;
  intro: string;
  closing: string;
  turns: DialogueTurn[];
  full_script: string;
}

const dialogueSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    digest_title: { type: "string" },
    intro: { type: "string" },
    closing: { type: "string" },
    turns: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          speaker: { type: "string", enum: ["host_a", "host_b"] },
          text: { type: "string" },
          thread_index: { type: "integer", minimum: 0 },
        },
        required: ["speaker", "text", "thread_index"],
      },
    },
  },
  required: ["digest_title", "intro", "closing", "turns"],
} as const;

function getOpenAiClient() {
  const env = getServerEnv();
  return { client: new OpenAI({ apiKey: env.OPENAI_API_KEY }), env };
}

function buildDialogueDigestPrompt(input: {
  dateLabel: string;
  persona?: PersonaId;
  summaryDepth?: SummaryDepthId;
  items: Array<{
    title: string;
    subreddit: string;
    whyItMatters: string;
    summary: string;
    keyTakeaways: string[];
    segmentWeightPrimary?: boolean;
    approxSecondsBudget?: number;
  }>;
}) {
  const persona = input.persona ?? "news_anchor";
  const depth = input.summaryDepth ?? "standard";
  const { min: minWords, max: maxWords } = depthScriptWordRange(depth);

  const threadBlock = input.items
    .map(
      (item, index) => `
${index + 1}. ${item.title} (${item.subreddit})
${item.segmentWeightPrimary ? `[PRIMARY SEGMENT ~${item.approxSecondsBudget ?? "?"}s]` : `[supporting ~${item.approxSecondsBudget ?? "?"}s]`}
Why it matters: ${item.whyItMatters}
Summary: ${item.summary}
Key takeaways: ${item.keyTakeaways.join("; ")}
`,
    )
    .join("\n");

  return `
Write a lively two-host podcast dialogue in English for "Reddit Voice Digest".

Hosts:
- host_a "Alex": curious, upbeat, asks sharp follow-up questions.
- host_b "Sam": grounded skeptic, translates Reddit noise into practical takeaways.

Output JSON:
- digest_title
- intro (single short paragraph, host_a welcomes listeners — not a turn)
- closing (single short paragraph, both hosts sign off — not a turn)
- turns: array of { speaker: "host_a" | "host_b", text, thread_index } — thread_index is 0-based and matches the thread order below

${personaScriptPromptAddition(persona)}

Rules:
${REDDIT_NOISE_FILTER_RULES}
${REDDIT_NATIVE_SCRIPT_SECTIONS}
- Alternate speakers often; react to each other ("Right", "Wait —", "So you're saying…").
- Use short spoken lines (1–3 sentences per turn). No stage directions, no markdown.
- Weave all thread summaries; spend more time on PRIMARY segments.
- Target ${minWords}–${maxWords} words across intro + turns + closing combined.
- Sound like a real podcast, not a monologue read by two people.

Date: ${input.dateLabel}

Thread summaries:
${threadBlock}
`.trim();
}

export function formatDialogueTranscript(script: Pick<DialogueDigestScript, "intro" | "turns" | "closing">) {
  const lines: string[] = [];

  if (script.intro.trim()) {
    lines.push(`Alex: ${script.intro.trim()}`);
  }

  for (const turn of script.turns) {
    const label = turn.speaker === "host_a" ? "Alex" : "Sam";
    lines.push(`${label}: ${turn.text.trim()}`);
  }

  if (script.closing.trim()) {
    lines.push(`Sam: ${script.closing.trim()}`);
  }

  return lines.join("\n\n");
}

/**
 * Turns summarized Reddit threads into a two-host dialogue script.
 */
export async function redditSummariesToDialogue(input: {
  dateLabel: string;
  persona?: PersonaId;
  summaryDepth?: SummaryDepthId;
  items: Array<{
    title: string;
    subreddit: string;
    whyItMatters: string;
    summary: string;
    keyTakeaways: string[];
    segmentWeightPrimary?: boolean;
    approxSecondsBudget?: number;
  }>;
}): Promise<DialogueDigestScript> {
  const { client, env } = getOpenAiClient();

  const response = await client.responses.create({
    model: resolveOpenAiScriptModel(env),
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: buildDialogueDigestPrompt(input) }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "dialogue_digest",
        schema: dialogueSchema,
        strict: true,
      },
    },
  });

  type RawDialogueTurn = { speaker: DialogueSpeaker; text: string; thread_index: number };

  const parsed = JSON.parse(response.output_text) as Omit<DialogueDigestScript, "full_script" | "turns"> & {
    turns: RawDialogueTurn[];
  };

  const turns: DialogueTurn[] = parsed.turns.map((turn: RawDialogueTurn) => ({
    speaker: turn.speaker,
    text: turn.text,
    threadIndex: turn.thread_index,
  }));

  const script: DialogueDigestScript = {
    digest_title: parsed.digest_title,
    intro: parsed.intro,
    closing: parsed.closing,
    turns,
    full_script: "",
  };

  script.full_script = formatDialogueTranscript(script);

  return script;
}
