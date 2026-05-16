"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatDigestDate } from "@/lib/date";

type ShareFormat = "twitter" | "stories";

const FONT_STACK =
  'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const CANVAS = {
  twitter: { width: 1200, height: 675 },
  stories: { width: 1080, height: 1920 },
} as const;

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];

  for (const word of words) {
    if (ctx.measureText(word).width > maxWidth) {
      let chunk = "";
      for (const ch of word) {
        const next = chunk + ch;
        if (ctx.measureText(next).width > maxWidth && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk = next;
        }
      }
      if (chunk) {
        lines.push(chunk);
      }
      continue;
    }

    const last = lines[lines.length - 1];
    const candidate = last ? `${last} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && last) {
      lines.push(word);
    } else {
      if (last) {
        lines[lines.length - 1] = candidate;
      } else {
        lines.push(word);
      }
    }
  }

  return lines.length ? lines : [""];
}

function fitQuote(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  maxFontSize: number,
  minFontSize: number,
): { fontSize: number; lines: string[]; lineHeight: number } {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 2) {
    const lineHeight = Math.round(fontSize * 1.3);
    ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
    const lines = wrapCanvasText(ctx, text, maxWidth);
    if (lines.length * lineHeight <= maxHeight) {
      return { fontSize, lines, lineHeight };
    }
  }

  const lineHeight = Math.round(minFontSize * 1.3);
  ctx.font = `600 ${minFontSize}px ${FONT_STACK}`;
  const lines = wrapCanvasText(ctx, text, maxWidth);
  let trimmed = [...lines];
  while (trimmed.length * lineHeight > maxHeight && trimmed.length > 1) {
    trimmed = trimmed.slice(0, -1);
  }

  if (trimmed.length * lineHeight > maxHeight) {
    return { fontSize: minFontSize, lines: [ellipsisLine(ctx, trimmed[0] ?? "", maxWidth)], lineHeight };
  }

  if (trimmed.length && trimmed.length < lines.length) {
    const lastIdx = trimmed.length - 1;
    trimmed[lastIdx] = ellipsisLine(ctx, trimmed[lastIdx], maxWidth);
  }

  return { fontSize: minFontSize, lines: trimmed, lineHeight };
}

function ellipsisLine(ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string {
  const ellipsis = "…";
  if (ctx.measureText(line).width <= maxWidth) {
    return line;
  }
  let low = 0;
  let high = line.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = line.slice(0, mid).trimEnd() + ellipsis;
    if (ctx.measureText(candidate).width <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  const cut = line.slice(0, low).trimEnd();
  return cut ? `${cut}${ellipsis}` : ellipsis;
}

function drawQuoteCard(
  canvas: HTMLCanvasElement,
  options: {
    format: ShareFormat;
    quote: string;
    threadLine: string;
    episodeLine: string;
  },
) {
  const { width, height } = CANVAS[options.format];
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#020617");
  bg.addColorStop(0.45, "#0f172a");
  bg.addColorStop(1, "#022c22");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * 0.5, height * 0.08, 0, width * 0.5, height * 0.08, width * 0.55);
  glow.addColorStop(0, "rgba(34, 211, 238, 0.22)");
  glow.addColorStop(0.35, "rgba(34, 211, 238, 0.06)");
  glow.addColorStop(1, "rgba(34, 211, 238, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const padX = options.format === "twitter" ? 72 : 64;
  const padY = options.format === "twitter" ? 56 : 96;
  const footerH = options.format === "twitter" ? 108 : 168;

  ctx.save();
  ctx.fillStyle = "rgba(34, 211, 238, 0.12)";
  ctx.font = `300 ${options.format === "twitter" ? 120 : 200}px ${FONT_STACK}`;
  ctx.fillText("“", padX - 8, padY + (options.format === "twitter" ? 96 : 140));
  ctx.restore();

  const quoteTop = padY + (options.format === "twitter" ? 48 : 72);
  const quoteMaxW = width - padX * 2;
  const quoteMaxH = height - quoteTop - footerH - 32;

  const maxQuoteFont = options.format === "twitter" ? 46 : 56;
  const minQuoteFont = options.format === "twitter" ? 26 : 32;
  const { fontSize, lines, lineHeight } = fitQuote(
    ctx,
    options.quote,
    quoteMaxW,
    quoteMaxH,
    maxQuoteFont,
    minQuoteFont,
  );

  ctx.fillStyle = "#f8fafc";
  ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
  let y = quoteTop + fontSize;
  for (const line of lines) {
    ctx.fillText(line, padX, y);
    y += lineHeight;
  }

  const metaY = height - footerH + 8;
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 ${options.format === "twitter" ? 22 : 28}px ${FONT_STACK}`;
  const threadWrapped = wrapCanvasText(ctx, options.threadLine, quoteMaxW);
  const threadLimit = options.format === "twitter" ? 2 : 3;
  threadWrapped.slice(0, threadLimit).forEach((line, i) => {
    ctx.fillText(line, padX, metaY + i * Math.round((options.format === "twitter" ? 22 : 28) * 1.35));
  });

  const episodeY =
    metaY +
    Math.min(threadWrapped.length, threadLimit) * Math.round((options.format === "twitter" ? 22 : 28) * 1.35) +
    (options.format === "twitter" ? 16 : 24);
  ctx.fillStyle = "#67e8f9";
  ctx.font = `600 ${options.format === "twitter" ? 18 : 22}px ${FONT_STACK}`;
  ctx.fillText(options.episodeLine, padX, episodeY);

  const barY = height - (options.format === "twitter" ? 56 : 72);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, barY);
  ctx.lineTo(width - padX, barY);
  ctx.stroke();

  const brandY = barY + (options.format === "twitter" ? 36 : 48);
  const r = options.format === "twitter" ? 10 : 12;
  ctx.strokeStyle = "rgba(103, 232, 249, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(padX + r, brandY - r, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#22d3ee";
  ctx.beginPath();
  ctx.arc(padX + r, brandY - r, r * 0.42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = `600 ${options.format === "twitter" ? 17 : 20}px ${FONT_STACK}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Reddit Voice Digest", padX + r * 2 + 16, brandY - r);

  ctx.fillStyle = "#64748b";
  ctx.font = `500 ${options.format === "twitter" ? 15 : 18}px ${FONT_STACK}`;
  ctx.textAlign = "right";
  ctx.fillText("redditvoicedigest", width - padX, brandY - r);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

export interface ShareInsightDialogProps {
  open: boolean;
  onClose: () => void;
  episodeSlug: string;
  episodeTitle: string;
  publishedAt: string;
  threadTitle: string;
  subredditName: string;
  summary: string;
  tldrPoints: string[];
}

export function ShareInsightDialog({
  open,
  onClose,
  episodeSlug,
  episodeTitle,
  publishedAt,
  threadTitle,
  subredditName,
  summary,
  tldrPoints,
}: ShareInsightDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<ShareFormat>("twitter");
  const [quoteId, setQuoteId] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const quoteOptions = useMemo(() => {
    const opts: { id: string; label: string; text: string }[] = [];
    const s = summary.trim();
    if (s) {
      opts.push({ id: "summary", label: "Краткое резюме", text: s });
    }
    tldrPoints.forEach((p, i) => {
      const t = p.trim();
      if (t) {
        opts.push({ id: `tldr-${i}`, label: `Инсайт ${i + 1}`, text: t });
      }
    });
    return opts;
  }, [summary, tldrPoints]);

  const resolvedQuoteId = useMemo(() => {
    if (quoteOptions.length === 0) {
      return "";
    }
    if (quoteId && quoteOptions.some((o) => o.id === quoteId)) {
      return quoteId;
    }
    return quoteOptions[0].id;
  }, [quoteId, quoteOptions]);

  const activeQuote = quoteOptions.find((o) => o.id === resolvedQuoteId) ?? quoteOptions[0];

  const episodeLine = `${episodeTitle} · ${formatDigestDate(publishedAt)}`;
  const threadLine = `r/${subredditName} · ${threadTitle}`;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeQuote?.text) {
      return;
    }
    drawQuoteCard(canvas, {
      format,
      quote: activeQuote.text,
      threadLine,
      episodeLine,
    });
  }, [format, activeQuote, threadLine, episodeLine]);

  useEffect(() => {
    if (!open) {
      return;
    }
    redraw();
  }, [open, redraw]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filename = useMemo(() => {
    const safe = episodeSlug.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 48);
    return `insight-${safe}-${format}.png`;
  }, [episodeSlug, format]);

  const getBlob = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    redraw();
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png");
    });
  }, [redraw]);

  const onDownload = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const blob = await getBlob();
      if (!blob) {
        setStatus("Не удалось создать изображение.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const blob = await getBlob();
      if (!blob) {
        setStatus("Не удалось создать изображение.");
        return;
      }
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Инсайт из Reddit Voice Digest",
          text: activeQuote?.text.slice(0, 200) ?? "",
        });
      } else {
        setStatus("Общий доступ к файлам недоступен в этом браузере — скачайте PNG.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setStatus("Не удалось открыть меню «Поделиться».");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      aria-labelledby="share-insight-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      <button
        aria-label="Закрыть"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-cyan-500/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300" id="share-insight-title">
              Поделиться инсайтом
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">Картинка для X / Stories</h3>
          </div>
          <button
            className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
            onClick={onClose}
            type="button"
          >
            Закрыть
          </button>
        </div>

        {!activeQuote ? (
          <p className="mt-6 text-sm text-slate-400">Нет текста для цитаты в этой карточке.</p>
        ) : (
          <>
            <label className="mt-6 block text-sm font-medium text-slate-300" htmlFor="share-quote-select">
              Текст на картинке
            </label>
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
              id="share-quote-select"
              onChange={(e) => setQuoteId(e.target.value)}
              value={resolvedQuoteId}
            >
              {quoteOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            <p className="mt-6 text-sm font-medium text-slate-300">Формат</p>
            <div className="mt-2 inline-flex rounded-full border border-white/10 bg-slate-950/50 p-1">
              <button
                className={`rounded-full px-4 py-2 text-sm ${
                  format === "twitter" ? "bg-cyan-400 text-slate-950" : "text-slate-300"
                }`}
                onClick={() => setFormat("twitter")}
                type="button"
              >
                X / Twitter (16∶9)
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm ${
                  format === "stories" ? "bg-cyan-400 text-slate-950" : "text-slate-300"
                }`}
                onClick={() => setFormat("stories")}
                type="button"
              >
                Stories (9∶16)
              </button>
            </div>

            <div className="mt-6 flex justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <canvas
                className="max-h-[min(48vh,420px)] w-full max-w-full object-contain"
                ref={canvasRef}
              />
            </div>

            {status ? <p className="mt-3 text-sm text-amber-200/90">{status}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex flex-1 min-w-[140px] items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/15 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-50"
                disabled={busy}
                onClick={onDownload}
                type="button"
              >
                Скачать PNG
              </button>
              <button
                className="inline-flex flex-1 min-w-[140px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:text-cyan-100 disabled:opacity-50"
                disabled={busy}
                onClick={onShare}
                type="button"
              >
                Системное «Поделиться»
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
