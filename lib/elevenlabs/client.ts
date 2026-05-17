import { elevenLabsDefaultVoiceSettings, getServerEnv } from "@/lib/config";
import { resolveElevenLabsVoiceProfile } from "@/lib/elevenlabs/voices";
import type { PersonaId } from "@/lib/types";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
/** Conservative per-request limit; long scripts are split with continuity hints. */
const MAX_TTS_INPUT_CHARS = 4500;

export async function renderWithElevenLabsTts(
  text: string,
  opts?: { voice?: string; persona?: PersonaId; elevenlabsVoiceOverride?: string | null },
) {
  const env = getServerEnv();
  const resolved = opts?.persona
    ? resolveElevenLabsVoiceProfile(opts.persona, opts.elevenlabsVoiceOverride ?? opts.voice)
    : null;
  const voiceId =
    opts?.voice?.trim() ||
    resolved?.voiceId ||
    (opts?.elevenlabsVoiceOverride?.trim() || null) ||
    env.ELEVENLABS_VOICE;
  const voiceSettings = resolved?.voiceSettings ?? elevenLabsDefaultVoiceSettings(env);

  if (!env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is required when AUDIO_PROVIDER=elevenlabs.");
  }

  const chunks = splitTextForTts(text);
  const buffers: Buffer[] = [];
  let previousText: string | undefined;

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]!;
    const nextText = chunks[index + 1];

    const audio = await synthesizeChunk({
      apiKey: env.ELEVENLABS_API_KEY,
      voiceId,
      modelId: env.ELEVENLABS_MODEL,
      outputFormat: env.ELEVENLABS_OUTPUT_FORMAT,
      text: chunk,
      voiceSettings,
      previousText,
      nextText,
    });

    buffers.push(audio);
    previousText = chunk.length > 400 ? chunk.slice(-400) : chunk;
  }

  return Buffer.concat(buffers);
}

async function synthesizeChunk(input: {
  apiKey: string;
  voiceId: string;
  modelId: string;
  outputFormat: string;
  text: string;
  voiceSettings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
    use_speaker_boost: boolean;
  };
  previousText?: string;
  nextText?: string;
}) {
  const url = new URL(`${ELEVENLABS_API_BASE}/text-to-speech/${encodeURIComponent(input.voiceId)}`);
  url.searchParams.set("output_format", input.outputFormat);

  const body: Record<string, unknown> = {
    text: input.text,
    model_id: input.modelId,
    voice_settings: input.voiceSettings,
  };

  if (input.previousText) {
    body.previous_text = input.previousText;
  }

  if (input.nextText) {
    body.next_text = input.nextText.length > 400 ? input.nextText.slice(0, 400) : input.nextText;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": input.apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${detail.slice(0, 500) || response.statusText}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
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
