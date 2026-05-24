import { renderWithElevenLabsTts } from "@/lib/elevenlabs/client";
import { getServerEnv } from "@/lib/config";
import { renderWithOpenAiTts } from "@/lib/openai/client";
import type { PersonaId } from "@/lib/types";

export async function renderPodcastAudio(
  text: string,
  opts?: { voice?: string; persona?: PersonaId; elevenlabsVoiceOverride?: string | null },
) {
  const env = getServerEnv();

  if (env.AUDIO_PROVIDER === "openai") {
    return renderWithOpenAiTts(text, opts?.voice);
  }

  if (env.AUDIO_PROVIDER === "elevenlabs") {
    return renderWithElevenLabsTts(text, {
      voice: opts?.voice,
      persona: opts?.persona,
      elevenlabsVoiceOverride: opts?.elevenlabsVoiceOverride,
    });
  }

  throw new Error(`Unsupported AUDIO_PROVIDER: ${env.AUDIO_PROVIDER}`);
}
