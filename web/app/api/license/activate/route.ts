export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { findLicense, setLicenseCookieHeader, TIER_CONFIG } from "@/lib/license";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { code?: string } | null;
  const code = (body?.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const lic = findLicense(code);
  if (!lic) return NextResponse.json({ error: "license not found" }, { status: 404 });
  if (lic.revoked) return NextResponse.json({ error: "license revoked" }, { status: 403 });
  if (Date.now() > new Date(lic.expiresAt).getTime()) {
    return NextResponse.json({ error: "license expired" }, { status: 403 });
  }

  const cfg = TIER_CONFIG[lic.tier];
  const res = NextResponse.json({
    ok: true,
    tier: lic.tier,
    expiresAt: lic.expiresAt,
    quotaRemaining: lic.quotaTotal - lic.quotaUsed,
    quotaTotal: lic.quotaTotal,
  });
  res.headers.append("Set-Cookie", setLicenseCookieHeader(code, cfg.hours));
  return res;
}
