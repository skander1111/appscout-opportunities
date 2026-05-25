export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { loadAllOpportunities } from "@/lib/loadOpportunities";

interface NicheCell {
  niche: string;
  count: number;
  avgScore: number;
  avgDaysStale: number;
  totalInstalls: number;
  topActions: Record<string, number>;
  hottestId?: string;
}

export async function GET() {
  const all = loadAllOpportunities({ limit: 500 });
  const map = new Map<string, NicheCell>();

  for (const o of all) {
    const niche = o.niche || "Uncategorised";
    let cell = map.get(niche);
    if (!cell) {
      cell = {
        niche,
        count: 0,
        avgScore: 0,
        avgDaysStale: 0,
        totalInstalls: 0,
        topActions: {},
      };
      map.set(niche, cell);
    }
    cell.count += 1;
    cell.avgScore += o.ai?.opportunityScore ?? o.legacyScore ?? 0;
    cell.avgDaysStale += o.daysStale ?? 0;
    cell.totalInstalls += o.installs ?? 0;
    const action = o.ai?.recommendedAction || "watch";
    cell.topActions[action] = (cell.topActions[action] ?? 0) + 1;
    if (!cell.hottestId || (o.ai?.opportunityScore ?? 0) > 70) {
      cell.hottestId = o.id;
    }
  }

  const cells = Array.from(map.values()).map((c) => ({
    ...c,
    avgScore: Math.round(c.avgScore / c.count),
    avgDaysStale: Math.round(c.avgDaysStale / c.count),
  })).sort((a, b) => b.count - a.count);

  return NextResponse.json({ niches: cells, total: all.length });
}
