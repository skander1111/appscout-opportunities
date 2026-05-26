export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadAllOpportunities } from "@/lib/loadOpportunities";
import { generateDeepDive, type DeepDive } from "@/lib/ai";
import { requireLicense } from "@/lib/license";

const CACHE_FILE = path.join(process.cwd(), "data", "deep-dives.json");

function loadCache(): Record<string, DeepDive> {
  if (!fs.existsSync(CACHE_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); }
  catch { return {}; }
}
function saveCache(c: Record<string, DeepDive>) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(c, null, 2));
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// "App of the day" — the daily auto-pick is FREE (cached, one Claude call per day).
// Targeted deep-dives by id are LOCKED (consume 2 quota units; heavy op).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const cache = loadCache();
  const all = loadAllOpportunities({ limit: 200 });

  // ── id-specific deep dive: gated unless cached
  if (id) {
    if (cache[id]) return NextResponse.json({ deepDive: cache[id], cached: true });

    const license = await requireLicense(req, "deep-dive", 2);
    if (!license.ok) return NextResponse.json(license.body, { status: license.status });

    const opp = all.find((o) => o.id === id);
    if (!opp) return NextResponse.json({ error: "not found" }, { status: 404 });
    const dd = await generateDeepDive(opp);
    cache[id] = dd;
    saveCache(cache);
    return NextResponse.json({ deepDive: dd, cached: false, quotaRemaining: license.remaining });
  }

  // ── daily auto-pick: served from cache only — no live Anthropic calls.
  // We pick today's opportunity deterministically, then return its cached
  // deep-dive if one exists, otherwise fall back to its cached AiPrediction
  // (also free). New Anthropic calls only happen for license-holders above.
  const top = all
    .filter((o) => (o.ai?.opportunityScore ?? o.legacyScore ?? 0) >= 60)
    .slice(0, 20);
  if (top.length === 0) return NextResponse.json({ error: "no candidates" }, { status: 404 });

  const dayKey = `daily-${today()}`;
  if (cache[dayKey]) return NextResponse.json({ deepDive: cache[dayKey], cached: true, dayKey });

  const seed = Array.from(today()).reduce((a, c) => a + c.charCodeAt(0), 0);
  const pick = top[seed % top.length];

  if (cache[pick.id]) {
    cache[dayKey] = cache[pick.id];
    saveCache(cache);
    return NextResponse.json({ deepDive: cache[dayKey], cached: true, dayKey });
  }

  // No cached dive — return a templated stub built from the existing AI
  // prediction (already on the opportunity). No new Anthropic call.
  const stub: DeepDive = {
    opportunityId: pick.id,
    title: pick.title,
    summary: pick.ai?.whyNow || `${pick.title} is today's spotlight opportunity. Unlock a full investigation with a license.`,
    ownerBackground: pick.owner ? `Owner: ${pick.owner}` : "Owner details available on the opportunity page.",
    revenueEstimate: pick.ai?.monetizationIdeas?.[0] || "Revenue estimate available with a deep dive license.",
    whyNow: pick.ai?.whyNow || "Stale window + reachable owner = act window.",
    rebuildPlan: pick.ai?.monetizationIdeas?.join("\n") || "Full rebuild plan unlocks with a license.",
    outreachPlan: pick.ai?.outreachDraft || "Outreach playbook is included with a license.",
    redFlags: pick.ai?.dueDiligence?.slice(0, 5) || [],
    generatedAt: new Date().toISOString(),
  };
  cache[dayKey] = stub;
  saveCache(cache);
  return NextResponse.json({ deepDive: stub, cached: false, dayKey, locked: true });
}
