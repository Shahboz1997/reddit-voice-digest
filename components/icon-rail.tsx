"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { IconHome, IconLibrary, IconRss, IconSettings } from "@/lib/ui-icons";

interface IconRailProps {
  rssUrl?: string;
}

const navItems = [
  { href: "/", label: "Home", Icon: IconHome, match: (path: string) => path === "/" },
  { href: "/#archive", label: "Archive", Icon: IconLibrary, match: (path: string) => path === "/" },
  { href: "/settings", label: "Settings", Icon: IconSettings, match: (path: string) => path.startsWith("/settings") },
] as const;

export function IconRail({ rssUrl }: IconRailProps) {
  const pathname = usePathname();

  return (
    <aside className="app-icon-rail radio-glass flex w-[72px] shrink-0 flex-col items-center gap-2 rounded-2xl py-4 sm:w-20">
      <Link className="mb-2 scale-90" href="/" title="Reddit Voice Digest">
        <BrandMark compact />
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col items-center gap-1">
        {navItems.map(({ href, label, Icon, match }) => {
          const active = match(pathname);

          return (
            <Link
              key={href}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                active
                  ? "bg-[var(--radio-pink)]/20 text-[var(--radio-pink)] ring-1 ring-[var(--radio-pink)]/50"
                  : "text-white/45 hover:bg-white/8 hover:text-white"
              }`}
              href={href}
              title={label}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}

        {rssUrl ? (
          <a
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/8 hover:text-[var(--radio-yellow)]"
            href={rssUrl}
            rel="noopener noreferrer"
            target="_blank"
            title="Podcast RSS"
          >
            <IconRss className="h-5 w-5" />
            <span className="sr-only">Podcast RSS</span>
          </a>
        ) : null}
      </nav>
    </aside>
  );
}
