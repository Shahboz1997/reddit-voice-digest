"use client";

import { useSyncExternalStore } from "react";

function subscribeToMediaQuery(query: string, onStoreChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getMediaQuerySnapshot(query: string) {
  return window.matchMedia(query).matches;
}

function getMediaQueryServerSnapshot() {
  return false;
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    getMediaQueryServerSnapshot,
  );
}
