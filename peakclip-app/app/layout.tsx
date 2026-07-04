import type { Metadata } from "next";
// Font imports removed
import "./globals.css";
import "./peakclip.css";
import { fonts } from "../lib/tokens";

// Removed Bebas Neue font definition

// Removed Poppins font definition

// Removed JetBrains Mono font definition

// Removed Teko font definition

export const metadata: Metadata = {
  title: "PeakClip — From long video to viral clip in seconds",
  description: "AI-powered clipping tool. Paste any link, PeakClip finds the best moments and creates viral Shorts & Reels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
