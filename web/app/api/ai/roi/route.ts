export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { loadAllOpportunities } from "@/lib/loadOpportunities";
import { simulateRoi } from "@/lib/ai";
import { requireLicense } from "@/lib/license";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as
    | { id?: string; askingPriceUsd?: number; monthlyMaintenanceHours?: number }
    | null;
  if (!body?.id || !body?.askingPriceUsd) {
    return NextResponse.json({ error: "id + askingPriceUsd required" }, { status: 400 });
  }

  const license = await requireLicense(req, "roi", 1);
  if (!license.ok) return NextResponse.json(license.body, { status: license.status });

  const all = loadAllOpportunities();
  const opp = all.find((o) => o.id === body.id);
  if (!opp) return NextResponse.json({ error: "opportunity not found" }, { status: 404 });

  const roi = await simulateRoi(opp, {
    askingPriceUsd: Math.max(1, Math.min(10_000_000, body.askingPriceUsd)),
    monthlyMaintenanceHours: body.monthlyMaintenanceHours,
  });

  return NextResponse.json({ roi, quotaRemaining: license.remaining });
}
