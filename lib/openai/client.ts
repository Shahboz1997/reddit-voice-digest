import OpenAI from "openai";

import {
  getOpenAiTtsEnv,
  getServerEnv,
  resolveOpenAiScriptModel,
  resolveOpenAiSummaryModel,
} from "@/lib/config";
import { buildDigestScriptPrompt, buildThreadSummaryPrompt } from "@/lib/prompts/digest";
import type { PersonaId, SummaryDepthId } from "@/lib/types";

const MAX_TTS_INPUT_CHARS = 3800;

type OpenAiTtsVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer";

const GPT_AUDIO_FALLBACK_MODEL = "gpt-audio-1.5";

function isGptAudioModel(model: string) {
  return model.trim().toLowerCase().startsWith("gpt-audio");
}

function isModelAccessError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = "status" in error ? error.status : undefined;
  const code = "code" in error ? error.code : undefined;

  return status === 403 || status === 404 || code === "model_not_found";
}

function resolveTtsVoice(voiceOverride: string | undefined, defaultVoice: string): OpenAiTtsVoice {
  return (voiceOverride?.trim() || defaultVoice) as OpenAiTtsVoice;
}

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
  persona?: PersonaId;
  summaryDepth?: SummaryDepthId;
}) {
  const { client, env } = getClient();

  const response = await client.responses.create({
    model: resolveOpenAiSummaryModel(env),
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
  const { client, env } = getClient();

  const response = await client.responses.create({
    model: resolveOpenAiScriptModel(env),
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

async function renderWithOpenAiSpeechTts(
  client: OpenAI,
  input: { model: string; voice: OpenAiTtsVoice; text: string },
) {
  const response = await client.audio.speech.create({
    model: input.model,
    voice: input.voice,
    input: input.text,
    response_format: "mp3",
  });

  return Buffer.from(await response.arrayBuffer());
}

async function renderWithGptAudioTts(
  client: OpenAI,
  input: { model: string; voice: OpenAiTtsVoice; text: string },
) {
  const response = await client.chat.completions.create({
    model: input.model,
    modalities: ["text", "audio"],
    audio: { voice: input.voice, format: "mp3" },
    messages: [
      {
        role: "user",
        content: `Read the following text aloud exactly as written. Do not add commentary or change the wording.\n\n${input.text}`,
      },
    ],
  });

  const audioData = response.choices[0]?.message.audio?.data;

  if (!audioData) {
    throw new Error("OpenAI gpt-audio response did not include audio data.");
  }

  return Buffer.from(audioData, "base64");
}

export async function renderWithOpenAiTts(text: string, voiceOverride?: string) {
  const env = getOpenAiTtsEnv();
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const voice = resolveTtsVoice(voiceOverride, env.OPENAI_TTS_VOICE);
  const model = env.OPENAI_TTS_MODEL.trim();
  const chunks = splitTextForTts(text);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    buffers.push(await renderOpenAiTtsChunk(client, { model, voice, text: chunk }));
  }

  return Buffer.concat(buffers);
}

async function renderOpenAiTtsChunk(
  client: OpenAI,
  input: { model: string; voice: OpenAiTtsVoice; text: string },
) {
  if (isGptAudioModel(input.model)) {
    return renderWithGptAudioTts(client, input);
  }

  try {
    return await renderWithOpenAiSpeechTts(client, input);
  } catch (error) {
    const fallbackModel = GPT_AUDIO_FALLBACK_MODEL;

    if (!isModelAccessError(error) || input.model === fallbackModel) {
      throw error;
    }

    return renderWithGptAudioTts(client, { ...input, model: fallbackModel });
  }
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
