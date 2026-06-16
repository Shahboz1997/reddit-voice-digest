export const PLAYBACK_RATES = [0.75, 1, 1.25] as const;

export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export const PLAYBACK_RATE_STORAGE_KEY = "reddit-voice-digest.playbackRate";

export function isPlaybackRate(value: number): value is PlaybackRate {
  return PLAYBACK_RATES.includes(value as PlaybackRate);
}

export function readStoredPlaybackRate(): PlaybackRate {
  if (typeof window === "undefined") {
    return 1;
  }

  try {
    const raw = window.localStorage.getItem(PLAYBACK_RATE_STORAGE_KEY);
    const parsed = raw ? Number.parseFloat(raw) : 1;
    return isPlaybackRate(parsed) ? parsed : 1;
  } catch {
    return 1;
  }
}

export function storePlaybackRate(rate: PlaybackRate) {
  window.localStorage.setItem(PLAYBACK_RATE_STORAGE_KEY, String(rate));
}

export function formatPlaybackRateLabel(rate: PlaybackRate) {
  return rate === 1 ? "1×" : `${rate}×`;
}
