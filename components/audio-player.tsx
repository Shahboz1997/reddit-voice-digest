"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { DigestChapter } from "@/lib/types";

interface AudioPlayerProps {
  audioUrl?: string;
  durationSeconds: number;
  chapters: DigestChapter[];
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function AudioPlayer({ audioUrl, durationSeconds, chapters }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealAudio = Boolean(audioUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

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

    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(durationSeconds);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [durationSeconds]);

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

  async function togglePlayback() {
    if (hasRealAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }

      return;
    }

    setIsPlaying((previous) => !previous);
  }

  function seekTo(nextTime: number) {
    const bounded = Math.max(0, Math.min(nextTime, durationSeconds));

    if (hasRealAudio && audioRef.current) {
      audioRef.current.currentTime = bounded;
    }

    setCurrentTime(bounded);
  }

  return (
    <div className="space-y-6">
      {audioUrl ? (
        <audio ref={audioRef} preload="none">
          <source src={audioUrl} />
        </audio>
      ) : null}

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400 text-lg font-semibold text-slate-950 transition hover:bg-cyan-300"
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
          <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
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
              className={`rounded-2xl border px-4 py-4 text-left transition ${
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
