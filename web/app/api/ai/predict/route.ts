export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { loadAllOpportunities, saveAiCache } from "@/lib/loadOpportunities";
import { generatePrediction } from "@/lib/ai";
import { requireLicense } from "@/lib/license";
import fs from "fs";
import path from "path";

interface AiCacheFile {
  [opportunityId: string]: Awaited<ReturnType<typeof generatePrediction>>;
}

function loadCache(): AiCacheFile {
  const file = path.join(process.cwd(), "data", "ai-predictions.json");
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return {}; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // ALL detailed predictions require an active license, even cached ones.
  // Cache hits don't consume quota but still need a valid license.
  const license = await requireLicense(req, "predict", 0);
  if (!license.ok) return NextResponse.json(license.body, { status: license.status });

  const cache = loadCache();
  if (cache[id]) {
    return NextResponse.json({ prediction: cache[id], cached: true, quotaRemaining: license.remaining });
  }

  // Fresh generation consumes 1 quota unit.
  const gen = await requireLicense(req, "predict", 1);
  if (!gen.ok) return NextResponse.json(gen.body, { status: gen.status });

  const all = loadAllOpportunities();
  const opp = all.find((o) => o.id === id);
  if (!opp) return NextResponse.json({ error: "opportunity not found" }, { status: 404 });

  const prediction = await generatePrediction(opp);
  cache[id] = prediction;
  saveAiCache(cache);

  return NextResponse.json({
    prediction,
    cached: false,
    quotaRemaining: gen.remaining,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 20) : [];
  if (!ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

  const cache = loadCache();
  const all = loadAllOpportunities();
  const map = new Map(all.map((o) => [o.id, o]));

  // count uncached
  const uncachedCount = ids.filter((id) => !cache[id] && map.has(id)).length;
  if (uncachedCount > 0) {
    const license = await requireLicense(req, "predict-batch", uncachedCount);
    if (!license.ok) return NextResponse.json(license.body, { status: license.status });
  }

  const results: Record<string, unknown> = {};
  for (const id of ids) {
    if (cache[id]) { results[id] = cache[id]; continue; }
    const opp = map.get(id);
    if (!opp) { results[id] = { error: "not found" }; continue; }
    const pred = await generatePrediction(opp);
    cache[id] = pred;
    results[id] = pred;
  }
  saveAiCache(cache);
  return NextResponse.json({ predictions: results });
}
