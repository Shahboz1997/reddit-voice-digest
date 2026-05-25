export interface TimedAudioSegment {
  buffer: Buffer;
  durationSeconds: number;
  /** Index into summarized threads; omitted for intro/closing. */
  threadIndex?: number;
  label?: string;
}

export interface ChapterMarker {
  threadIndex: number;
  startSeconds: number;
  endSeconds: number;
}

export interface RenderedEpisode {
  buffer: Buffer;
  durationSeconds: number;
  chapterMarkers: ChapterMarker[];
}
