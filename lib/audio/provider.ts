import { getServerEnv } from "@/lib/config";
import { renderWithElevenLabsTts } from "@/lib/elevenlabs/client";
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

  if (!env.ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY is required when AUDIO_PROVIDER=assemblyai.");
  }

  throw new Error(
    "AssemblyAI audio rendering is not wired yet because the public docs currently expose STT clearly but not a stable general TTS endpoint. The provider boundary is ready for a custom adapter once you confirm the target endpoint.",
  );
}
