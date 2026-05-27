import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";

import { AppProviders } from "@/components/app-providers";
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
  applicationName: "Reddit Voice Digest",
  appleWebApp: {
    capable: true,
    title: "RVD",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={montserrat.variable} lang="en">
      <body className="font-display antialiased">
        <AppProviders>
          <div aria-hidden className="radio-ambient">
            <div className="radio-ambient__pink" />
            <div className="radio-ambient__yellow" />
          </div>
          <div className="relative z-10 flex min-h-screen flex-col">
            {children}
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
