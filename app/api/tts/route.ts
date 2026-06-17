import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getMp3DurationSeconds } from "@/lib/audio/mp3-duration";
import { renderWithOpenAiTts } from "@/lib/openai/client";
import { TTS_PRESETS, type TtsPresetId } from "@/lib/tts-presets";

export const runtime = "nodejs";

function cacheFileForPreset(presetId: string) {
  return path.join(process.cwd(), "tmp", "tts-cache", `${presetId}.mp3`);
}

function ttsErrorResponse(error: unknown) {
  const openAiError = error as {
    status?: number;
    code?: string;
    message?: string;
    error?: { message?: string; code?: string };
  };

  const status = openAiError.status;
  const code = openAiError.code ?? openAiError.error?.code;
  const message = openAiError.message ?? openAiError.error?.message ?? "TTS failed.";

  if (status === 401 || code === "invalid_api_key") {
    return NextResponse.json(
      {
        error:
          "Invalid OPENAI_API_KEY. Create a new key at https://platform.openai.com/account/api-keys, set OPENAI_TTS_MODEL=gpt-audio-1.5 in .env.local, and restart the dev server.",
      },
      { status: 503 },
    );
  }

  if (status === 403 || status === 404 || code === "model_not_found") {
    return NextResponse.json(
      {
        error: `OpenAI TTS model unavailable (${message}). Set OPENAI_TTS_MODEL=gpt-audio-1.5 or tts-1 in .env.local.`,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: message }, { status: 500 });
}

function audioResponse(buffer: Buffer, cacheControl: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": cacheControl,
      "Content-Length": String(buffer.length),
    },
  });
}

export async function GET(request: Request) {
  const presetId = new URL(request.url).searchParams.get("preset")?.trim();

  if (!presetId || !(presetId in TTS_PRESETS)) {
    return NextResponse.json(
      { error: "Unknown preset. Use ?preset=ielts-opener" },
      { status: 400 },
    );
  }

  const preset = TTS_PRESETS[presetId as TtsPresetId];
  const cacheFile = cacheFileForPreset(presetId);

  try {
    const cached = await readFile(cacheFile);
    return audioResponse(cached, "public, max-age=31536000, immutable");
  } catch {
    // Cache miss — generate below.
  }

  try {
    const audio = await renderWithOpenAiTts(preset.text);
    await mkdir(path.dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, audio);

    const durationSeconds = getMp3DurationSeconds(audio);
    console.info(`[tts] rendered preset=${presetId} bytes=${audio.length} duration=${durationSeconds}s`);

    return audioResponse(audio, "public, max-age=86400");
  } catch (error) {
    console.error("[tts] render failed:", error);
    return ttsErrorResponse(error);
  }
}
