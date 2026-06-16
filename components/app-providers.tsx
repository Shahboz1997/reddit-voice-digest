"use client";

import { PwaRegister } from "@/components/pwa-register";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PwaRegister />
    </>
  );
}
