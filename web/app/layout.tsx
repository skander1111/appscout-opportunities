import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AppScout — The Bloomberg Terminal for Digital Opportunities",
  description:
    "Live intelligence terminal for abandoned apps, rebuild targets, GitHub projects, seller leads, and startup signals. AI-scored. Operator-ready. From $9.",
  metadataBase: new URL("https://appscout-ai.vercel.app"),
  openGraph: {
    title: "AppScout — Find digital opportunities before they're obvious",
    description:
      "AI-powered terminal scanning app stores, GitHub, startup communities, and seller posts. Acquire, rebuild, or partner — every signal scored by Claude.",
    url: "https://appscout-ai.vercel.app",
    siteName: "AppScout",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AppScout — Bloomberg-style terminal for digital opportunities",
    description:
      "Live intelligence across abandoned apps, GitHub, seller leads, and startup signals. AI-scored on 8 axes. From $9.",
    creator: "@skander_al58179",
  },
  keywords: [
    "app acquisition",
    "digital opportunities",
    "startup intelligence",
    "abandoned apps",
    "github stale projects",
    "rebuild opportunities",
    "indie app deals",
    "ai deal intelligence",
    "off-market apps",
    "project marketplace",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
