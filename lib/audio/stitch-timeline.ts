import { getMp3DurationSeconds } from "@/lib/audio/mp3-duration";
import type { ChapterMarker, TimedAudioSegment } from "@/lib/audio/types";

export function stitchMp3Segments(segments: Buffer[]): Buffer {
  if (!segments.length) {
    throw new Error("stitchMp3Segments: no audio segments provided.");
  }

  return Buffer.concat(segments.filter((segment) => segment.length > 0));
}

export function stitchTimedSegments(segments: TimedAudioSegment[]): {
  buffer: Buffer;
  durationSeconds: number;
  chapterMarkers: ChapterMarker[];
} {
  if (!segments.length) {
    throw new Error("stitchTimedSegments: no segments provided.");
  }

  let cursor = 0;
  const chapterMarkers: ChapterMarker[] = [];

  for (const segment of segments) {
    const duration =
      segment.durationSeconds > 0 ? segment.durationSeconds : getMp3DurationSeconds(segment.buffer);

    if (segment.threadIndex !== undefined && segment.threadIndex >= 0) {
      chapterMarkers.push({
        threadIndex: segment.threadIndex,
        startSeconds: cursor,
        endSeconds: cursor + duration,
      });
    }

    cursor += duration;
  }

  const buffer = stitchMp3Segments(segments.map((segment) => segment.buffer));
  const measured = getMp3DurationSeconds(buffer);
  const durationSeconds = measured > 0 ? measured : cursor;

  if (chapterMarkers.length && durationSeconds > 0 && Math.abs(durationSeconds - cursor) > 2) {
    const scale = durationSeconds / cursor;
    for (const marker of chapterMarkers) {
      marker.startSeconds = Math.round(marker.startSeconds * scale * 10) / 10;
      marker.endSeconds = Math.round(marker.endSeconds * scale * 10) / 10;
    }
  }

  return { buffer, durationSeconds, chapterMarkers };
}
