interface EqualizerProps {
  active: boolean;
  className?: string;
}

const BAR_DELAYS = ["0s", "0.12s", "0.05s", "0.18s", "0.08s", "0.15s", "0.03s", "0.1s", "0.14s", "0.06s"];

export function Equalizer({ active, className = "" }: EqualizerProps) {
  return (
    <div
      aria-hidden
      className={`equalizer flex h-14 items-end justify-center gap-[3px] ${active ? "equalizer--active" : ""} ${className}`}
    >
      {BAR_DELAYS.map((delay, index) => (
        <span
          key={index}
          className="equalizer__bar w-[5px] min-h-[4px] rounded-full bg-[var(--radio-pink)]"
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
  );
}
