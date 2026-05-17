import { formatThreadSegmentForTts } from "@/lib/audio/format-thread-tts";
import { measureMp3Buffer } from "@/lib/audio/mp3-duration";
import { stitchTimedSegments } from "@/lib/audio/stitch-timeline";
import type { RenderedEpisode, TimedAudioSegment } from "@/lib/audio/types";
import { renderPodcastAudio } from "@/lib/audio/provider";
import {
  renderDialogueEpisodeAudio,
  type RenderDialogueAudioOptions,
} from "@/src/lib/audio-stitch";
import type { DialogueTurn } from "@/src/lib/ai-engine";
import type { PersonaId } from "@/lib/types";

export interface ThreadScriptItem {
  title: string;
  subreddit: string;
  whyItMatters: string;
  summary: string;
  keyTakeaways: string[];
  segmentWeightPrimary?: boolean;
}

async function renderSegment(
  text: string,
  opts: { voice?: string; persona?: PersonaId; elevenlabsVoiceOverride?: string | null },
  meta: Pick<TimedAudioSegment, "threadIndex" | "label">,
): Promise<TimedAudioSegment> {
  const buffer = await renderPodcastAudio(text, opts);
  return {
    ...measureMp3Buffer(buffer),
    ...meta,
  };
}

/**
 * Monologue episode: intro → one TTS block per thread → closing (measured chapter markers).
 */
export async function renderMonologueEpisodeWithChapters(input: {
  intro: string;
  closing: string;
  items: ThreadScriptItem[];
  persona?: PersonaId;
  voice?: string;
  elevenlabsVoiceOverride?: string | null;
}): Promise<RenderedEpisode> {
  const ttsOpts = {
    voice: input.voice,
    persona: input.persona,
    elevenlabsVoiceOverride: input.elevenlabsVoiceOverride,
  };

  const segments: TimedAudioSegment[] = [];

  if (input.intro.trim()) {
    segments.push(
      await renderSegment(input.intro.trim(), ttsOpts, { label: "intro" }),
    );
  }

  for (let index = 0; index < input.items.length; index++) {
    const item = input.items[index]!;
    const text = formatThreadSegmentForTts({
      ...item,
      segmentWeightPrimary: item.segmentWeightPrimary ?? index === 0,
    });

    segments.push(
      await renderSegment(text, ttsOpts, { threadIndex: index, label: `thread:${index}` }),
    );
  }

  if (input.closing.trim()) {
    segments.push(
      await renderSegment(input.closing.trim(), ttsOpts, { label: "closing" }),
    );
  }

  return stitchTimedSegments(segments);
}

function assignThreadIndices(turns: DialogueTurn[], threadCount: number): DialogueTurn[] {
  if (threadCount <= 0 || !turns.length) {
    return turns;
  }

  const hasExplicit = turns.some((turn) => turn.threadIndex !== undefined);

  if (hasExplicit) {
    return turns.map((turn) => ({
      ...turn,
      threadIndex: Math.min(Math.max(turn.threadIndex ?? 0, 0), threadCount - 1),
    }));
  }

  const perThread = Math.max(1, Math.ceil(turns.length / threadCount));

  return turns.map((turn, index) => ({
    ...turn,
    threadIndex: Math.min(Math.floor(index / perThread), threadCount - 1),
  }));
}

function groupTurnsByThread(turns: DialogueTurn[], threadCount: number) {
  const buckets: DialogueTurn[][] = Array.from({ length: threadCount }, () => []);

  for (const turn of assignThreadIndices(turns, threadCount)) {
    const index = turn.threadIndex ?? 0;
    buckets[index]!.push(turn);
  }

  return buckets;
}

/**
 * Dialogue episode: intro → per-thread dialogue blocks → closing (measured chapter markers).
 */
export async function renderDialogueEpisodeWithChapters(input: {
  intro?: string;
  turns: DialogueTurn[];
  closing?: string;
  threadCount: number;
  renderOpts?: RenderDialogueAudioOptions;
}): Promise<RenderedEpisode> {
  const opts = input.renderOpts ?? {};
  const threadBuckets = groupTurnsByThread(input.turns, input.threadCount);
  const segments: TimedAudioSegment[] = [];

  if (input.intro?.trim()) {
    const buffer = await renderDialogueEpisodeAudio({
      intro: input.intro.trim(),
      turns: [],
      closing: "",
      ...opts,
    });
    segments.push({ ...measureMp3Buffer(buffer), label: "intro" });
  }

  for (let index = 0; index < threadBuckets.length; index++) {
    const bucket = threadBuckets[index]!;

    if (!bucket.length) {
      continue;
    }

    const buffer = await renderDialogueEpisodeAudio({
      turns: bucket,
      ...opts,
    });

    segments.push({
      ...measureMp3Buffer(buffer),
      threadIndex: index,
      label: `thread:${index}`,
    });
  }

  if (input.closing?.trim()) {
    const buffer = await renderDialogueEpisodeAudio({
      turns: [],
      closing: input.closing.trim(),
      ...opts,
    });
    segments.push({ ...measureMp3Buffer(buffer), label: "closing" });
  }

  if (!segments.length) {
    const buffer = await renderDialogueEpisodeAudio({
      intro: input.intro,
      turns: input.turns,
      closing: input.closing,
      ...opts,
    });

    return {
      buffer,
      durationSeconds: measureMp3Buffer(buffer).durationSeconds,
      chapterMarkers: [],
    };
  }

  return stitchTimedSegments(segments);
}
