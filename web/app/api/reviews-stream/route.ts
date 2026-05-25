export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface ReviewRow {
  appId: string;
  title: string;
  niche?: string;
  developer?: string;
  daysSinceUpdate?: number;
  installs?: string;
  url?: string;
  score: number;
  text: string;
  date: string;
}

interface RawApp {
  appId: string;
  title: string;
  niche?: string;
  developer?: string;
  installs?: string;
  url?: string;
  daysSinceUpdate?: number;
  reviewAnalysis?: {
    worstReviews?: { score: number; text: string; date: string }[];
  };
}

export async function GET(req: NextRequest) {
  const file = path.join(process.cwd(), "data", "opportunities.json");
  if (!fs.existsSync(file)) return NextResponse.json({ reviews: [] });
  const apps = JSON.parse(fs.readFileSync(file, "utf8")) as RawApp[];

  const { searchParams } = new URL(req.url);
  const maxScore = parseInt(searchParams.get("maxScore") || "2");
  const limit = Math.min(parseInt(searchParams.get("limit") || "80"), 300);
  const niche = searchParams.get("niche");

  const rows: ReviewRow[] = [];
  for (const a of apps) {
    const reviews = a.reviewAnalysis?.worstReviews || [];
    for (const r of reviews) {
      if (r.score > maxScore) continue;
      if (niche && a.niche !== niche) continue;
      rows.push({
        appId: a.appId,
        title: a.title,
        niche: a.niche,
        developer: a.developer,
        daysSinceUpdate: a.daysSinceUpdate,
        installs: a.installs,
        url: a.url,
        score: r.score,
        text: r.text,
        date: r.date,
      });
    }
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return NextResponse.json({ reviews: rows.slice(0, limit), total: rows.length });
}
