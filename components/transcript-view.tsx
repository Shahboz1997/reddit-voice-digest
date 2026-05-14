interface TranscriptViewProps {
  transcript: string;
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <h2 className="text-lg font-semibold text-white">Transcript</h2>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">{transcript}</p>
    </div>
  );
}
