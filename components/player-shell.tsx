"use client";

import type { ReactNode } from "react";

import { AuthHeader } from "@/components/auth-header";
import { IconRail } from "@/components/icon-rail";
import { LiveOnAirBadge } from "@/components/live-on-air-badge";

interface PlayerShellProps {
  children: ReactNode;
  player: ReactNode;
  rssUrl?: string;
  isPlaying?: boolean;
  topBar?: ReactNode;
}

export function PlayerShell({ children, player, rssUrl, isPlaying = false, topBar }: PlayerShellProps) {
  return (
    <div className="app-shell mx-auto flex min-h-screen w-full max-w-[1600px] gap-3 px-3 py-4 sm:gap-4 sm:px-4 lg:px-6 lg:py-5">
      <LiveOnAirBadge active={isPlaying} />

      <IconRail rssUrl={rssUrl} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="radio-glass mb-4 flex items-center justify-end gap-2 rounded-2xl px-3 py-2 sm:px-4">
          {topBar}
          <AuthHeader />
        </header>

        <div className="app-shell__main min-w-0 flex-1 pb-2">{children}</div>
      </div>

      {player}
    </div>
  );
}
