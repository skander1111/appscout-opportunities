export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { loadAllOpportunities } from "@/lib/loadOpportunities";

// Daily pulse: today's deltas + watchlist alerts.
// - new opportunities: those added in the last 24h (added_at)
// - fresh signals: signals < 2 days old
// - hot leads: seller leads < 7 days
// - watch alerts: opportunities the user watches whose score changed (server returns watched items; client compares to local snapshot)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { watchlist?: string[] };
  const watchlist = Array.isArray(body.watchlist) ? body.watchlist : [];

  const all = loadAllOpportunities({ limit: 500 });
  const now = Date.now();
  const day = 86_400_000;

  const fresh = all.filter((o) => new Date(o.addedAt).getTime() > now - 1.5 * day).slice(0, 8);
  const freshSignals = all.filter((o) => o.kind === "startup-signal" && (o.daysStale ?? 999) <= 2).slice(0, 6);
  const hotLeads = all.filter((o) => o.kind === "seller-lead" && (o.daysStale ?? 999) <= 14).slice(0, 6);
  const watchedItems = all.filter((o) => watchlist.includes(o.id));
  const topAi = [...all]
    .filter((o) => o.ai?.opportunityScore != null)
    .sort((a, b) => (b.ai!.opportunityScore - a.ai!.opportunityScore))
    .slice(0, 5);

  return NextResponse.json({
    date: new Date().toISOString().split("T")[0],
    counts: {
      total: all.length,
      newToday: fresh.length,
      freshSignals: freshSignals.length,
      hotLeads: hotLeads.length,
      watched: watchedItems.length,
    },
    sections: {
      newToday: fresh,
      freshSignals,
      hotLeads,
      watched: watchedItems,
      topAi,
    },
  });
}
