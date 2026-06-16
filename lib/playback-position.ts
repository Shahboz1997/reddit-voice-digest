const storageKey = "reddit-voice-digest.playback";
const changeEvent = "rvd:playback-position";

export interface SavedPlaybackPosition {
  slug: string;
  seconds: number;
  updatedAt: number;
}

let cachedRaw: string | null | undefined;
let cachedPosition: SavedPlaybackPosition | null = null;

function invalidatePlaybackPositionCache() {
  cachedRaw = undefined;
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
    const raw = JSON.stringify(payload);
    window.localStorage.setItem(storageKey, raw);
    cachedRaw = raw;
    cachedPosition = payload;
    window.dispatchEvent(new CustomEvent(changeEvent));
  } catch {
    // ignore quota errors
  }
}

export function subscribePlaybackPosition(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      invalidatePlaybackPositionCache();
      onStoreChange();
    }
  };

  const handleLocal = () => {
    invalidatePlaybackPositionCache();
    onStoreChange();
  };

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

    if (raw === cachedRaw) {
      return cachedPosition;
    }

    cachedRaw = raw;

    if (!raw) {
      cachedPosition = null;
      return null;
    }

    const parsed = JSON.parse(raw) as SavedPlaybackPosition;
    if (!parsed.slug || typeof parsed.seconds !== "number") {
      cachedPosition = null;
      return null;
    }

    cachedPosition = parsed;
    return cachedPosition;
  } catch {
    invalidatePlaybackPositionCache();
    cachedPosition = null;
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
      cachedRaw = null;
      cachedPosition = null;
      return;
    }

    const current = loadPlaybackPosition();
    if (current?.slug === slug) {
      window.localStorage.removeItem(storageKey);
      cachedRaw = null;
      cachedPosition = null;
      window.dispatchEvent(new CustomEvent(changeEvent));
    }
  } catch {
    // ignore
  }
}
