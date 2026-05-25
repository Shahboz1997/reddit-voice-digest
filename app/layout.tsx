import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";

import "@/app/globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reddit Voice Digest",
  description: "Turn long Reddit threads into short daily audio digests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={montserrat.variable} lang="en">
      <body className="font-display antialiased">
        <div aria-hidden className="radio-ambient">
          <div className="radio-ambient__pink" />
          <div className="radio-ambient__yellow" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
