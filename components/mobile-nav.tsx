"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconHome, IconLibrary, IconSettings } from "@/lib/ui-icons";

const items = [
  { href: "/", label: "Home", Icon: IconHome, isActive: (path: string) => path === "/" },
  {
    href: "/archive",
    label: "Archive",
    Icon: IconLibrary,
    isActive: (path: string) => path.startsWith("/archive"),
  },
  {
    href: "/settings",
    label: "Settings",
    Icon: IconSettings,
    isActive: (path: string) => path.startsWith("/settings"),
  },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile"
      className="mobile-nav app-ui fixed inset-x-0 bottom-0 z-[45] border-t backdrop-blur-xl sm:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {items.map(({ href, label, Icon, isActive }) => {
          const active = isActive(pathname);

          return (
            <li key={href} className="flex-1">
              <Link
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold transition ${
                  active
                    ? "bg-[var(--app-chip-bg)] text-[var(--accent-primary)]"
                    : "text-[var(--app-text-muted)] hover:bg-[var(--app-chip-hover)] hover:text-[var(--app-text)]"
                }`}
                href={href}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
