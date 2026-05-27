"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BroadcastPlaylist } from "@/components/broadcast-playlist";
import { Equalizer } from "@/components/equalizer";
import { MobileBottomSheet } from "@/components/mobile-bottom-sheet";
import { PlaybackRateControl, usePlaybackRate } from "@/components/playback-rate-control";
import { PlaybackAudioVisualizer } from "@/components/playback-audio-visualizer";
import { SubredditArt } from "@/components/subreddit-art";
import { clearPlaybackPosition, savePlaybackPosition } from "@/lib/playback-position";
import { expandPlayerEvent } from "@/lib/player-events";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  IconClose,
  IconPause,
  IconPlay,
  IconSkipBack,
  IconSkipForward,
  IconVolume,
} from "@/lib/ui-icons";
import type { DigestChapter, DigestItem } from "@/lib/types";

interface AudioPlayerProps {
  audioUrl?: string;
  durationSeconds: number;
  chapters: DigestChapter[];
  playlistItems?: DigestItem[];
  variant?: "default" | "radio" | "spotify";
  nowPlayingTitle?: string;
  episodeSlug?: string;
  initialSeekSeconds?: number;
  /** Parent-driven seek (e.g. queue row click). */
  seekRequest?: { seconds: number; token: number };
  /** Parent-driven play (e.g. hero Play button). */
  playRequest?: { token: number };
  onPlaybackChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (currentTime: number, activeChapter: DigestChapter | undefined) => void;
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

function findActiveChapter(chapters: DigestChapter[], currentTime: number) {
  return (
    chapters.find(
      (chapter) =>
        currentTime >= chapter.startSeconds &&
        currentTime < Math.max(chapter.endSeconds, chapter.startSeconds + 1),
    ) ?? chapters[chapters.length - 1]
  );
}

export function AudioPlayer({
  audioUrl,
  durationSeconds,
  chapters,
  playlistItems = [],
  variant = "default",
  nowPlayingTitle,
  episodeSlug,
  initialSeekSeconds = 0,
  seekRequest,
  playRequest,
  onPlaybackChange,
  onTimeUpdate,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealAudio = Boolean(audioUrl?.trim());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const playbackRate = usePlaybackRate();
  const isRadio = variant === "radio";
  const isSpotify = variant === "spotify";
  const isMobileLayout = useMediaQuery("(max-width: 767px)");
  const lastSavedPositionRef = useRef(0);

  useEffect(() => {
    onPlaybackChange?.(isPlaying);
  }, [isPlaying, onPlaybackChange]);

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

    const tickMs = Math.max(200, 1000 / playbackRate);

    intervalRef.current = setInterval(() => {
      setCurrentTime((previous) => {
        if (previous >= durationSeconds) {
          return durationSeconds;
        }

        const next = Math.min(previous + 1, durationSeconds);
        if (next >= durationSeconds) {
          queueMicrotask(() => setIsPlaying(false));
        }

        return next;
      });
    }, tickMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [durationSeconds, hasRealAudio, isPlaying, playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasRealAudio) {
      return;
    }

    audio.playbackRate = playbackRate;
    audio.defaultPlaybackRate = playbackRate;
  }, [hasRealAudio, playbackRate, audioUrl]);

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

    const startAt = Math.min(Math.max(initialSeekSeconds, 0), durationSeconds);

    const applyStartPosition = () => {
      audio.currentTime = startAt;
      setCurrentTime(startAt);
    };

    audio.pause();
    setIsPlaying(false);

    if (audio.readyState >= 1) {
      applyStartPosition();
      return;
    }

    audio.addEventListener("loadedmetadata", applyStartPosition, { once: true });
    return () => audio.removeEventListener("loadedmetadata", applyStartPosition);
  }, [audioUrl, durationSeconds, hasRealAudio, initialSeekSeconds]);

  const activeChapter = useMemo(
    () => findActiveChapter(chapters, currentTime),
    [chapters, currentTime],
  );

  const activeChapterIndex = useMemo(() => {
    if (!activeChapter) {
      return 0;
    }

    const index = chapters.findIndex((chapter) => chapter.id === activeChapter.id);
    return index >= 0 ? index : 0;
  }, [activeChapter, chapters]);

  const activeSubreddit =
    playlistItems[activeChapterIndex]?.subredditName ?? playlistItems[0]?.subredditName ?? "reddit";

  const canSkipBack = activeChapterIndex > 0;
  const canSkipForward = activeChapterIndex < chapters.length - 1;

  useEffect(() => {
    onTimeUpdate?.(currentTime, activeChapter);
  }, [activeChapter, currentTime, onTimeUpdate]);

  const progress = durationSeconds > 0 ? Math.min((currentTime / durationSeconds) * 100, 100) : 0;

  function skipChapter(direction: -1 | 1) {
    if (!chapters.length) {
      return;
    }

    const index = activeChapter
      ? chapters.findIndex((chapter) => chapter.id === activeChapter.id)
      : 0;
    const fromIndex = index >= 0 ? index : 0;
    const next = chapters[fromIndex + direction];

    if (next) {
      seekTo(next.startSeconds);
    }
  }

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

  const seekToRef = useRef(seekTo);
  seekToRef.current = seekTo;
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const skipChapterRef = useRef(skipChapter);
  skipChapterRef.current = skipChapter;
  const togglePlaybackRef = useRef(togglePlayback);
  togglePlaybackRef.current = togglePlayback;

  useEffect(() => {
    if (seekRequest == null) {
      return;
    }

    seekToRef.current(seekRequest.seconds);
  }, [seekRequest]);

  useEffect(() => {
    if (playRequest == null) {
      return;
    }

    if (hasRealAudio && audioRef.current) {
      void audioRef.current.play().catch((error) => {
        if (!isBenignPlayError(error)) {
          console.error(error);
        }
      });
      return;
    }

    setIsPlaying(true);
  }, [hasRealAudio, playRequest]);

  useEffect(() => {
    if (!isSpotify) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlaybackRef.current();
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        seekToRef.current(Math.max(0, currentTimeRef.current - 10));
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        seekToRef.current(Math.min(durationSeconds, currentTimeRef.current + 10));
        return;
      }

      if (event.code === "ArrowUp") {
        event.preventDefault();
        skipChapterRef.current(-1);
        return;
      }

      if (event.code === "ArrowDown") {
        event.preventDefault();
        skipChapterRef.current(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [durationSeconds, isSpotify]);

  useEffect(() => {
    if (!isSpotify) {
      return;
    }

    function handleExpandRequest() {
      setMobileExpanded(true);
    }

    window.addEventListener(expandPlayerEvent, handleExpandRequest);
    return () => window.removeEventListener(expandPlayerEvent, handleExpandRequest);
  }, [isSpotify]);

  useEffect(() => {
    if (!isSpotify || !episodeSlug || currentTime < 3) {
      return;
    }

    if (Math.abs(currentTime - lastSavedPositionRef.current) < 5) {
      return;
    }

    lastSavedPositionRef.current = currentTime;
    savePlaybackPosition(episodeSlug, currentTime);
  }, [currentTime, episodeSlug, isSpotify]);

  useEffect(() => {
    if (!isSpotify || !hasRealAudio || typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const displayTitle = activeChapter?.label ?? nowPlayingTitle ?? "Reddit Voice Digest";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: displayTitle,
      artist: `r/${activeSubreddit}`,
      album: nowPlayingTitle ?? "Reddit Voice Digest",
    });

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    try {
      navigator.mediaSession.setActionHandler("play", () => {
        togglePlaybackRef.current();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        togglePlaybackRef.current();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        skipChapterRef.current(-1);
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        skipChapterRef.current(1);
      });
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        seekToRef.current(Math.max(0, currentTimeRef.current - 15));
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        seekToRef.current(Math.min(durationSeconds, currentTimeRef.current + 15));
      });
    } catch {
      // Some browsers reject handlers when not playing
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
      } catch {
        // ignore
      }
    };
  }, [
    activeChapter?.label,
    activeSubreddit,
    durationSeconds,
    hasRealAudio,
    isPlaying,
    isSpotify,
    nowPlayingTitle,
  ]);

  useEffect(() => {
    if (isPlaying || currentTime < durationSeconds - 5 || !episodeSlug) {
      return;
    }

    if (currentTime >= durationSeconds - 1 && durationSeconds > 0) {
      clearPlaybackPosition(episodeSlug);
    }
  }, [currentTime, durationSeconds, episodeSlug, isPlaying]);

  if (isSpotify) {
    const displayTitle = activeChapter?.label ?? nowPlayingTitle ?? "Reddit Voice Digest";

    const nowPlayingMeta = (
      <div className="min-w-0">
        {episodeSlug ? (
          <Link
            className="block truncate text-sm font-semibold text-white transition hover:text-[var(--spotify-green)] hover:underline"
            href={`/digest/${episodeSlug}`}
            onClick={(event) => event.stopPropagation()}
            title={displayTitle}
          >
            {displayTitle}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-white">{displayTitle}</p>
        )}
        <div className="truncate text-xs text-white/45">
          {isPlaying ? (
            <span className="inline-flex items-center gap-2">
              <Equalizer active className="!h-3 !gap-[2px] [&_.equalizer__bar]:w-[3px]" />
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--radio-pink)]">
                Live
              </span>
            </span>
          ) : (
            <span className="font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(durationSeconds)}
            </span>
          )}
        </div>
      </div>
    );

    const transportControls = (size: "compact" | "full") => (
      <div className={`flex items-center justify-center ${size === "full" ? "gap-3 py-2" : "gap-1"}`}>
        <button
          aria-label="Previous segment"
          className={`flex items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent ${
            size === "full" ? "h-12 w-12" : "h-11 w-11"
          }`}
          disabled={!canSkipBack}
          onClick={() => skipChapter(-1)}
          type="button"
        >
          <IconSkipBack className="h-5 w-5" />
        </button>
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          aria-pressed={isPlaying}
          className={`flex items-center justify-center rounded-full bg-white text-black transition hover:scale-105 active:scale-95 ${
            size === "full" ? "h-14 w-14" : "h-11 w-11"
          }`}
          onClick={() => {
            void togglePlayback();
          }}
          type="button"
        >
          {isPlaying ? <IconPause className="h-6 w-6" /> : <IconPlay className="h-6 w-6" />}
        </button>
        <button
          aria-label="Next segment"
          className={`flex items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent ${
            size === "full" ? "h-12 w-12" : "h-11 w-11"
          }`}
          disabled={!canSkipForward}
          onClick={() => skipChapter(1)}
          type="button"
        >
          <IconSkipForward className="h-5 w-5" />
        </button>
      </div>
    );

    const seekBar = (className = "") => (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-white/45">
          {formatTime(currentTime)}
        </span>
        <input
          aria-label="Seek"
          className="radio-seek radio-seek--touch min-w-0 flex-1"
          max={durationSeconds}
          min={0}
          onChange={(event) => {
            seekTo(Number(event.target.value));
          }}
          step={1}
          type="range"
          value={currentTime}
        />
        <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-white/45">
          {formatTime(durationSeconds)}
        </span>
      </div>
    );

    return (
      <>
        {audioUrl ? (
          <audio key={audioUrl} ref={audioRef} crossOrigin="anonymous" preload="none">
            <source src={audioUrl} />
          </audio>
        ) : null}

        <footer
          className={`spotify-player-bar app-ui fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl ${
            isMobileLayout ? "spotify-player-bar--compact" : ""
          }`}
        >
          {/* Mobile: compact mini-player */}
          <div className="md:hidden">
            <div className="mx-auto flex max-w-lg items-center gap-2 px-3 pt-2">
              <button
                aria-label="Open player"
                className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left active:bg-white/5"
                onClick={() => setMobileExpanded(true)}
                type="button"
              >
                <SubredditArt size="md" subredditName={activeSubreddit} />
                {nowPlayingMeta}
              </button>
              {transportControls("compact")}
            </div>
            <div className="px-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
              <input
                aria-label="Seek"
                className="radio-seek radio-seek--touch radio-seek--thin w-full"
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

          {/* Desktop: full player bar */}
          <div className="hidden md:block">
            <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6">
              <div className="flex min-w-0 flex-[1.2] items-center gap-3">
                <SubredditArt size="md" subredditName={activeSubreddit} />
                {nowPlayingMeta}
              </div>

              {transportControls("compact")}

              <div className="flex min-w-0 flex-[1.5] items-center gap-3">
                {seekBar()}
                <PlaybackRateControl compact />
                <IconVolume className="hidden h-5 w-5 shrink-0 text-white/35 lg:block" aria-hidden />
              </div>
            </div>
          </div>
        </footer>

        {isMobileLayout ? (
          <MobileBottomSheet
            ariaLabel="Now playing"
            onClose={() => setMobileExpanded(false)}
            open={mobileExpanded}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--app-border)] px-4 py-3">
              <h2 className="text-sm font-bold text-[var(--app-text)]">Now playing</h2>
              <button
                aria-label="Close player"
                className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--app-text-muted)] transition hover:bg-[var(--app-chip-bg)] hover:text-[var(--app-text)]"
                onClick={() => setMobileExpanded(false)}
                type="button"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col items-center gap-4 py-4">
                <SubredditArt className="!h-28 !w-28 !rounded-lg" size="lg" subredditName={activeSubreddit} />
                <div className="w-full text-center">
                  <p className="text-lg font-bold text-[var(--app-text)]">{displayTitle}</p>
                  {nowPlayingTitle ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--app-text-muted)]">{nowPlayingTitle}</p>
                  ) : null}
                </div>
                {transportControls("full")}
                {seekBar("w-full max-w-md")}
                <div className="flex justify-center">
                  <PlaybackRateControl compact />
                </div>
              </div>

              {playlistItems.length > 0 ? (
                <div className="mt-2 rounded-lg bg-[var(--app-surface-elevated)] p-3">
                  <BroadcastPlaylist
                    activeChapterId={activeChapter?.id}
                    chapters={chapters}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    items={playlistItems}
                    onSelect={(seconds) => {
                      seekTo(seconds);
                    }}
                    variant="spotify"
                  />
                </div>
              ) : null}
            </div>
          </MobileBottomSheet>
        ) : null}
      </>
    );
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
                aria-pressed={isPlaying}
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
          const isActive = activeChapter?.id === chapter.id;

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
