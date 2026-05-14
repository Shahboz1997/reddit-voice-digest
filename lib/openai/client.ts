import OpenAI from "openai";

import { getServerEnv } from "@/lib/config";
import { buildDigestScriptPrompt, buildThreadSummaryPrompt } from "@/lib/prompts/digest";

const MAX_TTS_INPUT_CHARS = 3800;

const threadSummarySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    why_it_matters: { type: "string" },
    summary: { type: "string" },
    key_takeaways: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["why_it_matters", "summary", "key_takeaways"],
} as const;

const digestScriptSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    digest_title: { type: "string" },
    intro: { type: "string" },
    closing: { type: "string" },
    full_script: { type: "string" },
  },
  required: ["digest_title", "intro", "closing", "full_script"],
} as const;

function getClient() {
  const env = getServerEnv();

  return {
    client: new OpenAI({ apiKey: env.OPENAI_API_KEY }),
    env,
  };
}

export async function summarizeThread(input: {
  subreddit: string;
  title: string;
  body: string;
  comments: string[];
}) {
  const { client, env } = getClient();

  const response = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: buildThreadSummaryPrompt(input) }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "thread_summary",
        schema: threadSummarySchema,
        strict: true,
      },
    },
  });

  return JSON.parse(response.output_text) as {
    why_it_matters: string;
    summary: string;
    key_takeaways: string[];
  };
}

export async function generateDigestScript(input: {
  dateLabel: string;
  items: Array<{
    title: string;
    subreddit: string;
    whyItMatters: string;
    summary: string;
    keyTakeaways: string[];
  }>;
}) {
  const { client, env } = getClient();

  const response = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: buildDigestScriptPrompt(input) }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "digest_script",
        schema: digestScriptSchema,
        strict: true,
      },
    },
  });

  return JSON.parse(response.output_text) as {
    digest_title: string;
    intro: string;
    closing: string;
    full_script: string;
  };
}

export async function renderWithOpenAiTts(text: string) {
  const { client, env } = getClient();
  const chunks = splitTextForTts(text);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const response = await client.audio.speech.create({
      model: env.OPENAI_TTS_MODEL,
      voice: env.OPENAI_TTS_VOICE,
      input: chunk,
      response_format: "mp3",
    });

    buffers.push(Buffer.from(await response.arrayBuffer()));
  }

  return Buffer.concat(buffers);
}

function splitTextForTts(text: string) {
  if (text.length <= MAX_TTS_INPUT_CHARS) {
    return [text];
  }

  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((`${currentChunk} ${sentence}`).trim().length <= MAX_TTS_INPUT_CHARS) {
      currentChunk = `${currentChunk} ${sentence}`.trim();
      continue;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    if (sentence.length <= MAX_TTS_INPUT_CHARS) {
      currentChunk = sentence;
      continue;
    }

    let startIndex = 0;

    while (startIndex < sentence.length) {
      chunks.push(sentence.slice(startIndex, startIndex + MAX_TTS_INPUT_CHARS));
      startIndex += MAX_TTS_INPUT_CHARS;
    }

    currentChunk = "";
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
