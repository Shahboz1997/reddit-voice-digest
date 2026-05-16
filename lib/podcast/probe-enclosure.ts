async function probeEnclosureBytes(audioUrl: string): Promise<number | undefined> {
  const controller = new AbortController();
  const timeoutMs = 7000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res = await fetch(audioUrl, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    if (!res.ok || !res.headers.get("content-length")) {
      res = await fetch(audioUrl, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        signal: controller.signal,
        redirect: "follow",
      });
    }

    const len = res.headers.get("content-length");
    const parsed = len ? Number.parseInt(len, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

export { probeEnclosureBytes };
