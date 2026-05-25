import { stitchMp3Segments } from "@/lib/audio/stitch-timeline";
import { getServerEnv } from "@/lib/config";
import { resolveElevenLabsVoiceProfile } from "@/lib/elevenlabs/voices";
import { renderWithElevenLabsTts } from "@/lib/elevenlabs/client";
import { renderWithOpenAiTts } from "@/lib/openai/client";
import type { DialogueSpeaker, DialogueTurn } from "@/src/lib/ai-engine";
import type { PersonaId } from "@/lib/types";

export interface DialogueVoiceMap {
  host_a: string;
  host_b: string;
}

export interface RenderDialogueAudioOptions {
  persona?: PersonaId;
  elevenlabsVoiceOverride?: string | null;
  voiceMap?: Partial<DialogueVoiceMap>;
  /** Pause between lines (ms). Applied as silence only when stitching MP3 without re-encoding. */
  lineGapMs?: number;
}

const OPENAI_HOST_VOICES: DialogueVoiceMap = {
  host_a: "echo",
  host_b: "nova",
};

export function resolveDialogueVoiceMap(
  persona: PersonaId = "news_anchor",
  override?: Partial<DialogueVoiceMap>,
): DialogueVoiceMap {
  const env = getServerEnv();
  const primary = resolveElevenLabsVoiceProfile(persona, null);

  const defaults: DialogueVoiceMap =
    env.AUDIO_PROVIDER === "openai"
      ? { ...OPENAI_HOST_VOICES }
      : {
          host_a: env.ELEVENLABS_VOICE_HOST_A?.trim() || primary.voiceId,
          host_b:
            env.ELEVENLABS_VOICE_HOST_B?.trim() ||
            resolveElevenLabsVoiceProfile("scholar", null).voiceId,
        };

  return {
    host_a: override?.host_a?.trim() || defaults.host_a,
    host_b: override?.host_b?.trim() || defaults.host_b,
  };
}

async function renderLine(
  text: string,
  speaker: DialogueSpeaker,
  voiceMap: DialogueVoiceMap,
  opts: RenderDialogueAudioOptions,
) {
  const env = getServerEnv();
  const voice = voiceMap[speaker];

  if (env.AUDIO_PROVIDER === "openai") {
    return renderWithOpenAiTts(text, voice);
  }

  if (env.AUDIO_PROVIDER === "elevenlabs") {
    return renderWithElevenLabsTts(text, {
      voice,
      persona: opts.persona,
      elevenlabsVoiceOverride:
        speaker === "host_a" ? opts.elevenlabsVoiceOverride : undefined,
    });
  }

  throw new Error(`Multi-voice dialogue requires openai or elevenlabs (got ${env.AUDIO_PROVIDER}).`);
}

/**
 * Renders each dialogue turn with a distinct voice, then stitches MP3 segments.
 */
export async function renderDialogueAudio(
  turns: DialogueTurn[],
  opts: RenderDialogueAudioOptions = {},
): Promise<Buffer> {
  if (!turns.length) {
    throw new Error("renderDialogueAudio: dialogue has no turns.");
  }

  const voiceMap = resolveDialogueVoiceMap(opts.persona, opts.voiceMap);
  const segments: Buffer[] = [];

  for (const turn of turns) {
    const trimmed = turn.text.trim();
    if (!trimmed) {
      continue;
    }

    segments.push(await renderLine(trimmed, turn.speaker, voiceMap, opts));
  }

  if (!segments.length) {
    throw new Error("renderDialogueAudio: all turns were empty after trimming.");
  }

  return stitchMp3Segments(segments);
}

export async function renderDialogueEpisodeAudio(input: {
  intro?: string;
  turns: DialogueTurn[];
  closing?: string;
  persona?: PersonaId;
  elevenlabsVoiceOverride?: string | null;
  voiceMap?: Partial<DialogueVoiceMap>;
}): Promise<Buffer> {
  const blocks: DialogueTurn[] = [];

  if (input.intro?.trim()) {
    blocks.push({ speaker: "host_a", text: input.intro.trim() });
  }

  blocks.push(...input.turns);

  if (input.closing?.trim()) {
    blocks.push({ speaker: "host_b", text: input.closing.trim() });
  }

  return renderDialogueAudio(blocks, {
    persona: input.persona,
    elevenlabsVoiceOverride: input.elevenlabsVoiceOverride,
    voiceMap: input.voiceMap,
  });
}
