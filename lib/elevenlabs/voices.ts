import type { PersonaId } from "@/lib/types";

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
  use_speaker_boost: boolean;
}

export interface ElevenLabsVoiceOption {
  id: string;
  name: string;
  hint: string;
  recommendedPersonas: PersonaId[];
  voiceSettings: ElevenLabsVoiceSettings;
}

/** Curated premade voices — expressive podcast delivery (ElevenLabs voice library). */
export const ELEVENLABS_VOICE_CATALOG: readonly ElevenLabsVoiceOption[] = [
  {
    id: "iP95p4xoKVk53GoZ742B",
    name: "Chris",
    hint: "Lively, conversational — great for the bro host persona.",
    recommendedPersonas: ["bro_investor"],
    voiceSettings: {
      stability: 0.34,
      similarity_boost: 0.8,
      style: 0.5,
      speed: 1.06,
      use_speaker_boost: true,
    },
  },
  {
    id: "TxGEqnHWrfWFTfGW9XjX",
    name: "Josh",
    hint: "Young, energetic American — morning show energy.",
    recommendedPersonas: ["bro_investor"],
    voiceSettings: {
      stability: 0.36,
      similarity_boost: 0.79,
      style: 0.46,
      speed: 1.05,
      use_speaker_boost: true,
    },
  },
  {
    id: "onwK4e9ZLuTAKqWW03F9",
    name: "Daniel",
    hint: "Calm British authority — researcher tone.",
    recommendedPersonas: ["scholar"],
    voiceSettings: {
      stability: 0.5,
      similarity_boost: 0.82,
      style: 0.26,
      speed: 0.97,
      use_speaker_boost: true,
    },
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    hint: "Deep, thoughtful — long-form explainers.",
    recommendedPersonas: ["scholar"],
    voiceSettings: {
      stability: 0.48,
      similarity_boost: 0.8,
      style: 0.3,
      speed: 0.98,
      use_speaker_boost: true,
    },
  },
  {
    id: "nPczCjzI2devNBz1zQrb",
    name: "Brian",
    hint: "Deep announcer tone — news desk.",
    recommendedPersonas: ["news_anchor"],
    voiceSettings: {
      stability: 0.46,
      similarity_boost: 0.78,
      style: 0.3,
      speed: 1,
      use_speaker_boost: true,
    },
  },
  {
    id: "TX3LPaxmHKxFdv7VOQHJ",
    name: "Liam",
    hint: "Clear articulation — neutral evening broadcast.",
    recommendedPersonas: ["news_anchor"],
    voiceSettings: {
      stability: 0.44,
      similarity_boost: 0.8,
      style: 0.28,
      speed: 1.02,
      use_speaker_boost: true,
    },
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    hint: "Warm storytelling — soft host delivery.",
    recommendedPersonas: ["news_anchor"],
    voiceSettings: {
      stability: 0.42,
      similarity_boost: 0.78,
      style: 0.34,
      speed: 1,
      use_speaker_boost: true,
    },
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    hint: "Soft, trustworthy tone — lifestyle and advice.",
    recommendedPersonas: ["scholar", "news_anchor"],
    voiceSettings: {
      stability: 0.45,
      similarity_boost: 0.8,
      style: 0.32,
      speed: 0.99,
      use_speaker_boost: true,
    },
  },
] as const;

const PERSONA_DEFAULT_VOICE_ID: Record<PersonaId, string> = {
  bro_investor: "iP95p4xoKVk53GoZ742B",
  scholar: "onwK4e9ZLuTAKqWW03F9",
  news_anchor: "nPczCjzI2devNBz1zQrb",
};

const catalogById = new Map(ELEVENLABS_VOICE_CATALOG.map((voice) => [voice.id, voice]));

export function getElevenLabsVoiceOption(voiceId: string): ElevenLabsVoiceOption | undefined {
  return catalogById.get(voiceId);
}

export function defaultElevenLabsVoiceIdForPersona(persona: PersonaId): string {
  return PERSONA_DEFAULT_VOICE_ID[persona] ?? PERSONA_DEFAULT_VOICE_ID.news_anchor;
}

export function resolveElevenLabsVoiceId(persona: PersonaId, overrideId?: string | null): string {
  const trimmed = overrideId?.trim();
  if (trimmed) {
    return trimmed;
  }

  return defaultElevenLabsVoiceIdForPersona(persona);
}

export function resolveElevenLabsVoiceProfile(
  persona: PersonaId,
  overrideId?: string | null,
): { voiceId: string; voiceSettings: ElevenLabsVoiceSettings } {
  const voiceId = resolveElevenLabsVoiceId(persona, overrideId);
  const catalogVoice = getElevenLabsVoiceOption(voiceId);

  if (catalogVoice) {
    return { voiceId: catalogVoice.id, voiceSettings: catalogVoice.voiceSettings };
  }

  const personaDefault = getElevenLabsVoiceOption(defaultElevenLabsVoiceIdForPersona(persona));

  return {
    voiceId,
    voiceSettings:
      personaDefault?.voiceSettings ?? {
        stability: 0.42,
        similarity_boost: 0.78,
        style: 0.35,
        speed: 1,
        use_speaker_boost: true,
      },
  };
}

export function isKnownElevenLabsVoiceId(voiceId: string): boolean {
  return catalogById.has(voiceId);
}

export function normalizeElevenLabsVoiceIdInput(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  if (!/^[a-zA-Z0-9]{16,32}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}
