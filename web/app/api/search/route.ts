export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { loadAllOpportunities } from "@/lib/loadOpportunities";
import { searchOpportunities } from "@/lib/ai";
import { requireLicense } from "@/lib/license";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { query?: string } | null;
  const query = (body?.query || "").trim();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const license = await requireLicense(req, "search", 1);
  if (!license.ok) return NextResponse.json(license.body, { status: license.status });

  const all = loadAllOpportunities({ limit: 200 });
  const result = await searchOpportunities(query, all);

  const byId = new Map(all.map((o) => [o.id, o]));
  const matches = result.ranking
    .map((r) => ({ ...r, opportunity: byId.get(r.opportunityId) }))
    .filter((r) => r.opportunity);

  return NextResponse.json({ matches, filter: result.filter, query, quotaRemaining: license.remaining });
}
