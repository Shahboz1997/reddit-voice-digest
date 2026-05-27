"use client";

import { useSyncExternalStore } from "react";

import {
  formatPlaybackRateLabel,
  PLAYBACK_RATES,
  readStoredPlaybackRate,
  storePlaybackRate,
  type PlaybackRate,
} from "@/lib/playback-rate";

function subscribe(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "reddit-voice-digest.playbackRate" || event.key === null) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

interface PlaybackRateControlProps {
  className?: string;
  compact?: boolean;
}

export function PlaybackRateControl({ className = "", compact = false }: PlaybackRateControlProps) {
  const rate = useSyncExternalStore(subscribe, readStoredPlaybackRate, () => 1 as PlaybackRate);

  function setRate(next: PlaybackRate) {
    storePlaybackRate(next);
    window.dispatchEvent(new Event("rvd-playback-rate"));
  }

  return (
    <div
      className={`inline-flex items-center rounded-full bg-[var(--app-chip-bg)] p-0.5 ${className}`}
      role="group"
      aria-label="Playback speed"
    >
      {PLAYBACK_RATES.map((option) => {
        const active = rate === option;

        return (
          <button
            key={option}
            aria-pressed={active}
            className={`rounded-full px-2 py-1 font-mono text-[11px] font-bold tabular-nums transition ${
              active
                ? "bg-[var(--accent-primary)] text-[var(--accent-on-primary)]"
                : "text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
            } ${compact ? "min-w-[2.25rem]" : "min-w-[2.5rem]"}`}
            onClick={() => setRate(option)}
            type="button"
          >
            {formatPlaybackRateLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

export function usePlaybackRate() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === "reddit-voice-digest.playbackRate" || event.key === null) {
          onStoreChange();
        }
      };

      const handleCustom = () => onStoreChange();

      window.addEventListener("storage", handleStorage);
      window.addEventListener("rvd-playback-rate", handleCustom);
      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("rvd-playback-rate", handleCustom);
      };
    },
    readStoredPlaybackRate,
    () => 1 as PlaybackRate,
  );
}
