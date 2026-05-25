import Link from "next/link";
import type { ReactNode } from "react";

import { publicEnv } from "@/lib/config";

const DEVELOPER_EMAIL = "supportstratum@gmail.com";

const footerColumns = [
  {
    links: [
      { href: "/", label: "Home" },
      { href: "/settings", label: "Settings" },
      {
        href: `${publicEnv.NEXT_PUBLIC_APP_URL}/api/podcast/feed`,
        label: "Podcast RSS",
        external: true,
      },
    ],
  },
  {
    links: [
      { href: "/#archive", label: "Episode archive" },
      { href: "/settings", label: "Subreddits" },
      { href: "/#player", label: "Player" },
    ],
  },
  {
    links: [
      { href: "/#about", label: "About" },
      { href: `mailto:${DEVELOPER_EMAIL}`, label: "Contact" },
    ],
  },
  {
    links: [
      {
        href: `mailto:${DEVELOPER_EMAIL}`,
        label: "Contact developers",
        showChevron: true,
      },
      { href: "#privacy", label: "Privacy policy" },
      { href: "#terms", label: "Terms of use" },
    ],
  },
] as const;

function FooterLink({
  href,
  label,
  external,
  showChevron,
}: {
  href: string;
  label: string;
  external?: boolean;
  showChevron?: boolean;
}) {
  const className =
    "site-footer-link group inline-flex items-center gap-1.5 text-[13px] leading-snug text-white/45 transition hover:text-white";

  const content = (
    <>
      <span>{label}</span>
      {showChevron ? (
        <svg
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 opacity-50 transition group-hover:opacity-90"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </>
  );

  if (external || href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a className={className} href={href} rel={external ? "noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>
        {content}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}

function SocialIcon({ children, href, label }: { children: ReactNode; href: string; label: string }) {
  return (
    <a
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto border-t border-white/[0.08] bg-[#0a0a0a]">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          {footerColumns.map((column, columnIndex) => (
            <nav key={columnIndex} aria-label={`Footer section ${columnIndex + 1}`} className="flex flex-col gap-3">
              {column.links.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </nav>
          ))}

          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1 lg:items-end xl:col-span-1">
            <div className="flex flex-wrap items-center gap-1 lg:justify-end">
              <SocialIcon href={`mailto:${DEVELOPER_EMAIL}`} label="Email developers">
                <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <rect height="16" rx="2" width="20" x="2" y="4" />
                  <path d="m22 6-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SocialIcon>
              <SocialIcon href={`mailto:${DEVELOPER_EMAIL}`} label="Telegram">
                <svg aria-hidden className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </SocialIcon>
            </div>

            <p className="text-[12px] leading-relaxed text-white/35 lg:text-right">
              <a className="site-footer-link hover:text-white/70" href={`mailto:${DEVELOPER_EMAIL}`}>
                {DEVELOPER_EMAIL}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
            © 2025—{year} Reddit Voice Digest
          </p>
          <p className="text-[12px] text-white/30">
            Reddit threads → daily audio digest
          </p>
        </div>
      </div>
    </footer>
  );
}
