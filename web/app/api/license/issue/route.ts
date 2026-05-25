export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { issueLicense, type LicenseTier, TIER_CONFIG } from "@/lib/license";

// Admin-only: issue a new license. In production this is called by the Gumroad webhook
// once payment clears. For dev / manual use, require APPSCOUT_ADMIN_TOKEN.

export async function POST(req: NextRequest) {
  const adminToken = req.headers.get("x-appscout-admin");
  if (!adminToken || adminToken !== process.env.APPSCOUT_ADMIN_TOKEN) {
    return NextResponse.json({ error: "admin token required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { tier?: LicenseTier; email?: string; source?: string } | null;
  const tier = body?.tier;
  if (!tier || !TIER_CONFIG[tier]) {
    return NextResponse.json({ error: "invalid tier; use report|monthly|yearly" }, { status: 400 });
  }

  const lic = issueLicense(tier, { email: body?.email, source: body?.source });
  return NextResponse.json({
    code: lic.code,
    tier: lic.tier,
    expiresAt: lic.expiresAt,
    quotaTotal: lic.quotaTotal,
    activateUrl: `/activate?code=${encodeURIComponent(lic.code)}`,
  });
}
