"use client";

import { useEffect, useState } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ toast, onDismiss, durationMs = 3200 }: ToastProps) {
  if (!toast) {
    return null;
  }

  // Remount per toast id so we can reset local state without
  // calling setState synchronously inside an effect.
  return <ToastView key={toast.id} toast={toast} onDismiss={onDismiss} durationMs={durationMs} />;
}

interface ToastViewProps {
  toast: ToastMessage;
  onDismiss: () => void;
  durationMs: number;
}

function ToastView({ toast, onDismiss, durationMs }: ToastViewProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onDismiss, 200);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss]);

  const variantClass =
    toast.variant === "success"
      ? "border-[var(--accent-primary)]/40 bg-[var(--app-surface)] text-[var(--app-text)]"
      : toast.variant === "error"
        ? "border-red-500/40 bg-red-950/90 text-red-100"
        : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]";

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 z-[100] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 transition-all duration-200 ${
        visible ? "bottom-24 translate-y-0 opacity-100 sm:bottom-8" : "bottom-20 translate-y-2 opacity-0 sm:bottom-6"
      }`}
      role="status"
    >
      <p
        className={`pointer-events-auto rounded-xl border px-4 py-3 text-center text-sm font-semibold shadow-2xl backdrop-blur-md ${variantClass}`}
      >
        {toast.message}
      </p>
    </div>
  );
}

let toastId = 0;

export function createToast(message: string, variant: ToastVariant = "success"): ToastMessage {
  toastId += 1;
  return { id: toastId, message, variant };
}
