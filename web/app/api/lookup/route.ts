export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { loadAllOpportunities } from "@/lib/loadOpportunities";
import { generatePrediction } from "@/lib/ai";
import { requireLicense } from "@/lib/license";
import type { Opportunity } from "@/lib/opportunities";

function parseUrl(raw: string): { source: string; key: string } | null {
  try {
    const u = new URL(raw);
    if (u.hostname.includes("play.google.com")) {
      const id = u.searchParams.get("id");
      if (id) return { source: "googleplay", key: id };
    }
    if (u.hostname.includes("apps.apple.com")) {
      const m = u.pathname.match(/id(\d+)/);
      if (m) return { source: "appstore", key: m[1] };
    }
    if (u.hostname === "github.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) return { source: "github", key: `${parts[0]}/${parts[1]}` };
    }
    if (u.hostname.includes("reddit.com")) {
      return { source: "reddit", key: u.pathname };
    }
  } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { url?: string } | null;
  const url = (body?.url || "").trim();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const parsed = parseUrl(url);
  if (!parsed) return NextResponse.json({ error: "unsupported URL — paste a Play Store, App Store, GitHub, or Reddit URL" }, { status: 400 });

  const all = loadAllOpportunities({ limit: 500 });

  let match: Opportunity | undefined;
  if (parsed.source === "googleplay") {
    match = all.find((o) => o.id === `app-android-${parsed.key}`);
  } else if (parsed.source === "appstore") {
    match = all.find((o) => o.id === `app-ios-${parsed.key}`);
  } else if (parsed.source === "github") {
    match = all.find((o) => o.id === `gh-${parsed.key.replace("/", "-")}`);
  } else if (parsed.source === "reddit") {
    match = all.find((o) => o.url && o.url.includes(parsed.key));
  }

  // If matched + already has AI, FREE — no license needed.
  if (match?.ai) {
    return NextResponse.json({ opportunity: match, matched: true });
  }

  // Otherwise we need a license (generates new AI).
  const license = await requireLicense(req, "lookup", 1);
  if (!license.ok) return NextResponse.json(license.body, { status: license.status });

  if (match) {
    match.ai = await generatePrediction(match);
    return NextResponse.json({ opportunity: match, matched: true, quotaRemaining: license.remaining });
  }

  const synthetic: Opportunity = {
    id: `lookup-${parsed.source}-${Buffer.from(parsed.key).toString("base64").slice(0, 16)}`,
    source: parsed.source as Opportunity["source"],
    kind: parsed.source === "github" ? "github-stale" : parsed.source === "reddit" ? "seller-lead" : "abandoned-app",
    title: parsed.key.split("/").pop() || url,
    description: `URL submitted via reverse lookup. No engine data yet.`,
    url,
    addedAt: new Date().toISOString(),
  };
  synthetic.ai = await generatePrediction(synthetic);

  return NextResponse.json({ opportunity: synthetic, matched: false, quotaRemaining: license.remaining });
}
