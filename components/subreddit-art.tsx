import { getSubredditStation } from "@/lib/subreddit-stations";

export function subredditGradient(name: string) {
  let hash = 0;

  for (const char of name) {
    hash = (hash + char.charCodeAt(0)) | 0;
  }

  const hue = Math.abs(hash) % 360;
  const hue2 = (hue + 48) % 360;

  return `linear-gradient(135deg, hsl(${hue} 72% 42%) 0%, hsl(${hue2} 68% 28%) 100%)`;
}

interface SubredditArtProps {
  subredditName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-9 w-9 rounded-md [&_svg]:h-4 [&_svg]:w-4",
  md: "h-11 w-11 rounded-lg [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-14 w-14 rounded-xl [&_svg]:h-6 [&_svg]:w-6",
  xl: "h-48 w-48 rounded-2xl sm:h-56 sm:w-56 [&_svg]:h-14 [&_svg]:w-14",
};

export function SubredditArt({ subredditName, size = "md", className = "" }: SubredditArtProps) {
  const station = getSubredditStation(subredditName);
  const { Icon } = station;

  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center text-white shadow-lg shadow-black/40 ${sizeClasses[size]} ${className}`}
      style={{ background: subredditGradient(subredditName) }}
    >
      <Icon className="opacity-95" />
    </div>
  );
}

export function EpisodeCoverArt({
  topics,
  title,
  className = "",
}: {
  topics: string[];
  title: string;
  className?: string;
}) {
  const primary = topics[0] ?? "reddit";

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <SubredditArt size="xl" subredditName={primary} />
      <p className="max-w-md text-center font-display text-lg font-extrabold uppercase tracking-wide text-[var(--app-text)] line-clamp-2 sm:text-xl">
        {title}
      </p>
    </div>
  );
}
