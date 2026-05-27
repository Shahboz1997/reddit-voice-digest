const storageKey = "reddit-voice-digest.playback";
const changeEvent = "rvd:playback-position";

export interface SavedPlaybackPosition {
  slug: string;
  seconds: number;
  updatedAt: number;
}

export function savePlaybackPosition(slug: string, seconds: number) {
  if (typeof window === "undefined" || !slug || seconds < 3) {
    return;
  }

  try {
    const payload: SavedPlaybackPosition = {
      slug,
      seconds: Math.floor(seconds),
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(changeEvent));
  } catch {
    // ignore quota errors
  }
}

export function subscribePlaybackPosition(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      onStoreChange();
    }
  };

  const handleLocal = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(changeEvent, handleLocal);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(changeEvent, handleLocal);
  };
}

export function loadPlaybackPosition(): SavedPlaybackPosition | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SavedPlaybackPosition;
    if (!parsed.slug || typeof parsed.seconds !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearPlaybackPosition(slug?: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!slug) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    const current = loadPlaybackPosition();
    if (current?.slug === slug) {
      window.localStorage.removeItem(storageKey);
      window.dispatchEvent(new CustomEvent(changeEvent));
    }
  } catch {
    // ignore
  }
}
