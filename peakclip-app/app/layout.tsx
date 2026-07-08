import type { Metadata } from "next";
import { Bebas_Neue, Poppins, JetBrains_Mono, Teko } from "next/font/google";
import "./globals.css";
import "./peakclip.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const teko = Teko({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-teko",
  display: "swap",
});

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
      className={`${bebasNeue.variable} ${poppins.variable} ${jetbrainsMono.variable} ${teko.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
