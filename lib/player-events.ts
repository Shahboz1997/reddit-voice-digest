export const expandPlayerEvent = "rvd:expand-player";

export function requestExpandPlayer() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(expandPlayerEvent));
}
