"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

import { Equalizer } from "@/components/equalizer";

interface PlaybackAudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioUrl?: string;
  isPlaying: boolean;
  hasRealAudio: boolean;
  className?: string;
  width?: number;
  height?: number;
}

type LiveAudioVisualizerProps = {
  barColor?: string;
  barWidth?: number;
  backgroundColor?: string;
  fftSize?: number;
  gap?: number;
  height?: number;
  maxDecibels?: number;
  mediaRecorder: MediaRecorder;
  minDecibels?: number;
  smoothingTimeConstant?: number;
  width?: number;
};

type AudioWithCapture = HTMLAudioElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

function getCaptureStream(audio: HTMLAudioElement): MediaStream | null {
  const el = audio as AudioWithCapture;

  if (typeof el.captureStream === "function") {
    return el.captureStream();
  }

  if (typeof el.mozCaptureStream === "function") {
    return el.mozCaptureStream();
  }

  return null;
}

function pickRecorderMimeType() {
  const candidates = ["audio/webm", "audio/webm;codecs=opus", ""];

  for (const type of candidates) {
    if (!type || MediaRecorder.isTypeSupported(type)) {
      return type || undefined;
    }
  }

  return undefined;
}

/** Loaded only in the browser — react-audio-visualize breaks under React 19 SSR. */
function LazyLiveAudioVisualizer({
  fallback,
  ...props
}: LiveAudioVisualizerProps & { fallback: React.ReactNode }) {
  const [Viz, setViz] = useState<ComponentType<LiveAudioVisualizerProps> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void import("react-audio-visualize")
      .then((mod) => {
        if (!cancelled) {
          setViz(mod.LiveAudioVisualizer as ComponentType<LiveAudioVisualizerProps>);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadFailed || !Viz) {
    return <>{fallback}</>;
  }

  return <Viz {...props} />;
}

/**
 * Routes <audio> playback through MediaRecorder + LiveAudioVisualizer (react-audio-visualize)
 * so bars react to the actual AI voice waveform.
 */
export function PlaybackAudioVisualizer({
  audioRef,
  audioUrl,
  isPlaying,
  hasRealAudio,
  className = "",
  width = 300,
  height = 64,
}: PlaybackAudioVisualizerProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [captureSupported, setCaptureSupported] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !hasRealAudio || !audioUrl) {
      setCaptureSupported(false);
      setMediaRecorder(null);
      recorderRef.current = null;
      return;
    }

    let stream: MediaStream | null;

    try {
      stream = getCaptureStream(audio);
    } catch {
      stream = null;
    }

    if (!stream) {
      setCaptureSupported(false);
      return;
    }

    const mimeType = pickRecorderMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    recorderRef.current = recorder;
    setMediaRecorder(recorder);
    setCaptureSupported(true);

    return () => {
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // ignore teardown races
        }
      }

      recorderRef.current = null;
      setMediaRecorder(null);
    };
  }, [audioRef, audioUrl, hasRealAudio]);

  useEffect(() => {
    const recorder = recorderRef.current;

    if (!recorder || !captureSupported) {
      return;
    }

    try {
      if (isPlaying) {
        if (recorder.state === "inactive") {
          recorder.start(250);
        } else if (recorder.state === "paused") {
          recorder.resume();
        }
      } else if (recorder.state === "recording") {
        recorder.pause();
      }
    } catch {
      // Some browsers reject start until audio has data — retry on next play tick.
    }
  }, [captureSupported, isPlaying]);

  const fallback = <Equalizer active={isPlaying} className={className} />;

  if (!hasRealAudio || !captureSupported || !mediaRecorder) {
    return fallback;
  }

  return (
    <div className={`overflow-hidden ${className}`} style={{ width, height }}>
      <LazyLiveAudioVisualizer
        backgroundColor="transparent"
        barColor="var(--radio-pink)"
        barWidth={4}
        fallback={fallback}
        fftSize={256}
        gap={2}
        height={height}
        maxDecibels={-20}
        mediaRecorder={mediaRecorder}
        minDecibels={-85}
        smoothingTimeConstant={0.65}
        width={width}
      />
    </div>
  );
}
