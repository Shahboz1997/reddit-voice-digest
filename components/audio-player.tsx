"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BroadcastPlaylist } from "@/components/broadcast-playlist";
import { PlaybackAudioVisualizer } from "@/components/playback-audio-visualizer";
import type { DigestChapter, DigestItem } from "@/lib/types";

interface AudioPlayerProps {
  audioUrl?: string;
  durationSeconds: number;
  chapters: DigestChapter[];
  playlistItems?: DigestItem[];
  variant?: "default" | "radio";
  nowPlayingTitle?: string;
  onPlaybackChange?: (isPlaying: boolean) => void;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function isBenignPlayError(error: unknown) {
  const dom = error as DOMException | undefined;
  if (!dom?.name) return false;
  return dom.name === "AbortError" || dom.name === "NotAllowedError";
}

export function AudioPlayer({
  audioUrl,
  durationSeconds,
  chapters,
  playlistItems = [],
  variant = "default",
  nowPlayingTitle,
  onPlaybackChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealAudio = Boolean(audioUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const isRadio = variant === "radio";

  useEffect(() => {
    onPlaybackChange?.(isPlaying);
  }, [isPlaying, onPlaybackChange]);

  useEffect(() => {
    if (!hasRealAudio) {
      setIsPlaying(false);
    }
  }, [hasRealAudio]);

  useEffect(() => {
    if (hasRealAudio) {
      return;
    }

    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentTime((previous) => {
        if (previous >= durationSeconds) {
          setIsPlaying(false);
          return durationSeconds;
        }

        return Math.min(previous + 1, durationSeconds);
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [durationSeconds, hasRealAudio, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !hasRealAudio) {
      return;
    }

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(durationSeconds);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl, durationSeconds, hasRealAudio]);

  useEffect(() => {
    if (!hasRealAudio || !audioUrl) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioUrl, hasRealAudio]);

  const activeChapter = useMemo(() => {
    return (
      chapters.find(
        (chapter) =>
          currentTime >= chapter.startSeconds &&
          currentTime < Math.max(chapter.endSeconds, chapter.startSeconds + 1),
      ) ?? chapters[chapters.length - 1]
    );
  }, [chapters, currentTime]);

  const progress = durationSeconds > 0 ? Math.min((currentTime / durationSeconds) * 100, 100) : 0;

  function togglePlayback() {
    if (hasRealAudio && audioRef.current) {
      const audio = audioRef.current;

      if (!audio.paused) {
        audio.pause();
        return;
      }

      void audio.play().catch((error) => {
        if (isBenignPlayError(error)) {
          return;
        }

        console.error(error);
        setIsPlaying(false);
      });

      return;
    }

    setIsPlaying((previous) => !previous);
  }

  function seekTo(nextTime: number) {
    const bounded = Math.max(0, Math.min(nextTime, durationSeconds));

    if (hasRealAudio && audioRef.current) {
      const audio = audioRef.current;
      const wasPlaying = !audio.paused;

      if (wasPlaying) {
        audio.pause();
      }

      if (typeof audio.fastSeek === "function") {
        try {
          audio.fastSeek(bounded);
        } catch {
          audio.currentTime = bounded;
        }
      } else {
        audio.currentTime = bounded;
      }

      setCurrentTime(bounded);

      if (wasPlaying) {
        void audio.play().catch((error) => {
          if (!isBenignPlayError(error)) {
            console.error(error);
          }
        });
      }

      return;
    }

    setCurrentTime(bounded);
  }

  if (isRadio) {
    return (
      <div className="w-full">
        {audioUrl ? (
          <audio key={audioUrl} ref={audioRef} crossOrigin="anonymous" preload="none">
            <source src={audioUrl} />
          </audio>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-stretch">
          <div className="min-w-0">
            <div className="radio-glass relative overflow-hidden rounded-2xl px-5 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
                <button
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="radio-play-btn group relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[var(--radio-pink)] text-black transition hover:scale-[1.03] active:scale-[0.98] sm:h-32 sm:w-32"
                  onClick={() => {
                    void togglePlayback();
                  }}
                  type="button"
                >
                  {isPlaying ? (
                    <span className="flex gap-2">
                      <span className="h-10 w-2.5 rounded-sm bg-black" />
                      <span className="h-10 w-2.5 rounded-sm bg-black" />
                    </span>
                  ) : (
                    <span className="ml-1.5 h-0 w-0 border-y-[18px] border-l-[30px] border-y-transparent border-l-black" />
                  )}
                </button>

                <div className="flex flex-1 flex-col items-center gap-5 text-center lg:items-start lg:text-left">
                  <PlaybackAudioVisualizer
                    audioRef={audioRef}
                    audioUrl={audioUrl}
                    className="w-full max-w-xs lg:max-w-sm"
                    hasRealAudio={hasRealAudio}
                    height={64}
                    isPlaying={isPlaying}
                    width={320}
                  />
                  <div>
                    <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-white/45">
                      Now on air
                    </p>
                    <p className="mt-2 max-w-xl font-display text-lg font-extrabold uppercase leading-tight tracking-wide text-white sm:text-2xl">
                      {activeChapter?.label ?? nowPlayingTitle ?? "Reddit Voice Digest"}
                    </p>
                    <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/55">
                      {activeChapter?.summary ??
                        (hasRealAudio ? "Live stream from today’s digest." : "Demo playback until MP3 is ready.")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--radio-pink)] to-[var(--radio-yellow)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between font-mono text-xs tabular-nums text-white/50">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(durationSeconds)}</span>
                </div>
                <input
                  aria-label="Seek podcast"
                  className="radio-seek w-full"
                  max={durationSeconds}
                  min={0}
                  onChange={(event) => {
                    seekTo(Number(event.target.value));
                  }}
                  step={1}
                  type="range"
                  value={currentTime}
                />
              </div>
            </div>
          </div>

          {playlistItems.length > 0 ? (
            <div className="radio-glass min-h-[280px] rounded-2xl p-4 sm:p-5 xl:min-h-0 xl:max-h-[420px]">
              <BroadcastPlaylist
                activeChapterId={activeChapter?.id}
                chapters={chapters}
                currentTime={currentTime}
                isPlaying={isPlaying}
                items={playlistItems}
                onSelect={seekTo}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {audioUrl ? (
        <audio key={audioUrl} ref={audioRef} crossOrigin="anonymous" preload="none">
          <source src={audioUrl} />
        </audio>
      ) : null}

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400 text-lg font-semibold text-slate-950 transition-colors duration-150 hover:bg-cyan-300"
            onClick={() => {
              void togglePlayback();
            }}
            type="button"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Daily podcast</p>
            <p className="mt-1 text-sm text-slate-300">
              {hasRealAudio
                ? "Interactive playback is live."
                : "Demo playback is active until a real MP3 is uploaded."}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium text-white">{activeChapter?.label ?? "Overview"}</p>
          <p className="mt-1 max-w-sm text-sm text-slate-300">{activeChapter?.summary}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(durationSeconds)}</span>
        </div>

        <input
          aria-label="Seek podcast"
          className="w-full accent-cyan-400"
          max={durationSeconds}
          min={0}
          onChange={(event) => {
            seekTo(Number(event.target.value));
          }}
          step={1}
          type="range"
          value={currentTime}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {chapters.map((chapter) => {
          const isActive =
            currentTime >= chapter.startSeconds && currentTime < Math.max(chapter.endSeconds, chapter.startSeconds + 1);

          return (
            <button
              key={chapter.id}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors duration-150 ${
                isActive
                  ? "border-cyan-400/40 bg-cyan-400/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              }`}
              onClick={() => {
                seekTo(chapter.startSeconds);
              }}
              type="button"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                {formatTime(chapter.startSeconds)}
              </p>
              <p className="mt-2 text-sm font-medium text-white">{chapter.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{chapter.summary}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
