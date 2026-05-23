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
  title: "AppScout — Find Abandoned Mobile Apps Before They Hit Flippa",
  description:
    "AppScout scans 247+ mobile apps weekly and surfaces acquisition targets, rebuild opportunities, and partnership leads — with developer emails and ready-to-send outreach included.",
  metadataBase: new URL("https://appscout-ai.vercel.app"),
  openGraph: {
    title: "AppScout — Find Off-Market App Deals Before Anyone Else",
    description:
      "AI-powered deal intelligence for mobile app acquisitions. 54 qualified targets live this week — developer emails included, human-reviewed, €19.",
    url: "https://appscout-ai.vercel.app",
    siteName: "AppScout",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AppScout — Find Abandoned Mobile Apps Before They Hit Flippa",
    description:
      "54 qualified acquisition targets this week. Developer emails included. Buy before they list on Flippa.",
    creator: "@skander_al58179",
  },
  keywords: [
    "app acquisition",
    "buy mobile apps",
    "abandoned apps",
    "indie app deals",
    "off-market apps",
    "app flippa alternative",
    "mobile app business",
    "acquire app",
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
