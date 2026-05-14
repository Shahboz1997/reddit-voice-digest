import type { Metadata } from "next";

import "@/app/globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
