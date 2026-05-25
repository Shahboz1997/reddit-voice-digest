import {
  resolveElevenLabsVoiceId,
  resolveElevenLabsVoiceProfile,
} from "@/lib/elevenlabs/voices";
import type { PersonaId, SummaryDepthId } from "@/lib/types";

export {
  defaultElevenLabsVoiceIdForPersona,
  ELEVENLABS_VOICE_CATALOG,
  isKnownElevenLabsVoiceId,
  resolveElevenLabsVoiceId,
  resolveElevenLabsVoiceProfile,
} from "@/lib/elevenlabs/voices";

export const PERSONAS: readonly { id: PersonaId; label: string; hint: string }[] = [
  {
    id: "bro_investor",
    label: "Bro investor",
    hint: "Fast, bold pace and punchy asides.",
  },
  {
    id: "scholar",
    label: "Scholar",
    hint: "Calm, precise, exploratory tone.",
  },
  {
    id: "news_anchor",
    label: "News anchor",
    hint: "Formal, neutral broadcast style.",
  },
] as const;

export const SUMMARY_DEPTHS: readonly { id: SummaryDepthId; label: string; targetMinutes: number }[] = [
  { id: "short", label: "Short — facts only (~2 min)", targetMinutes: 2 },
  { id: "standard", label: "Standard (~5 min)", targetMinutes: 5 },
  { id: "deep", label: "Deep Dive — detail & comment flavor (~10 min)", targetMinutes: 10 },
] as const;

export function personaThreadPromptAddition(persona: PersonaId): string {
  switch (persona) {
    case "bro_investor":
      return "Voice: brisk, cheeky mentor-investor. Short sentences. Confident verbs. Minimal hedging.";
    case "scholar":
      return "Voice: reflective researcher. Measured pacing, nuanced caveats, define terms briefly.";
    case "news_anchor":
      return "Voice: neutral TV news presenter. Formal register, inverted-pyramid clarity, zero slang.";
    default:
      return "";
  }
}

export function personaScriptPromptAddition(persona: PersonaId): string {
  switch (persona) {
    case "bro_investor":
      return "Host persona: charismatic finance bro hosting a tight morning show.";
    case "scholar":
      return "Host persona: curious academic summarizing rigorous discussion.";
    case "news_anchor":
      return "Host persona: NPR-style news desk reader.";
    default:
      return "";
  }
}

export function personaOpenAiTtsVoice(persona: PersonaId): string {
  switch (persona) {
    case "bro_investor":
      return "echo";
    case "scholar":
      return "alloy";
    case "news_anchor":
      return "onyx";
    default:
      return "alloy";
  }
}

export function personaElevenLabsProfile(persona: PersonaId) {
  return resolveElevenLabsVoiceProfile(persona, null);
}

export function personaElevenLabsVoice(persona: PersonaId): string {
  return resolveElevenLabsVoiceId(persona, null);
}

export function personaTtsVoice(
  persona: PersonaId,
  provider: "openai" | "elevenlabs" | "assemblyai",
  elevenlabsVoiceOverride?: string | null,
): string {
  if (provider === "elevenlabs") {
    return resolveElevenLabsVoiceId(persona, elevenlabsVoiceOverride);
  }

  return personaOpenAiTtsVoice(persona);
}

export function depthCommentSampleCount(depth: SummaryDepthId): number {
  switch (depth) {
    case "short":
      return 6;
    case "standard":
      return 12;
    case "deep":
      return 24;
    default:
      return 12;
  }
}

/** Total episode length targets (approximate, used for pacing + chapters). */
export function depthTargetEpisodeSeconds(depth: SummaryDepthId): number {
  switch (depth) {
    case "short":
      return 120;
    case "standard":
      return 300;
    case "deep":
      return 600;
    default:
      return 300;
  }
}

export function depthScriptWordRange(depth: SummaryDepthId): { min: number; max: number } {
  switch (depth) {
    case "short":
      return { min: 260, max: 340 };
    case "standard":
      return { min: 600, max: 720 };
    case "deep":
      return { min: 1150, max: 1320 };
    default:
      return { min: 600, max: 720 };
  }
}

export function depthThreadSummaryPromptAddition(depth: SummaryDepthId): string {
  switch (depth) {
    case "short":
      return "Depth: skim for facts and consensus bullets only.";
    case "standard":
      return "Depth: balance practical takeaway with brief context.";
    case "deep":
      return "Depth: surface minority opinions and memorable comment lines where they add clarity (no vulgarity).";
    default:
      return "";
  }
}

/** First segment weighted time; remainder split evenly (floor), min 24s secondary. */
export function allocateChapterSeconds(segmentCount: number, totalSeconds: number): number[] {
  if (segmentCount <= 0) return [];
  if (segmentCount === 1) return [totalSeconds];

  const primaryBudget = Math.min(180, Math.floor(totalSeconds * 0.45));
  const remainder = totalSeconds - primaryBudget;
  const secondaryCount = segmentCount - 1;
  const even = Math.max(24, Math.floor(remainder / secondaryCount));
  const out = [primaryBudget];
  let allocated = primaryBudget;

  for (let i = 1; i < segmentCount; i++) {
    const slice = i === segmentCount - 1 ? Math.max(24, totalSeconds - allocated) : even;
    out.push(slice);
    allocated += slice;
  }

  let drift = totalSeconds - out.reduce((a, b) => a + b, 0);
  let idx = out.length - 1;
  while (drift !== 0 && idx >= 0) {
    const add = drift > 0 ? 1 : -1;
    if (out[idx]! + add >= 24) {
      out[idx] = out[idx]! + add;
      drift -= add;
    }
    idx--;
  }

  return out;
}
