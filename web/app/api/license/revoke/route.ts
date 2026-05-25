export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { revoke } from "@/lib/license";

export async function POST(req: NextRequest) {
  const adminToken = req.headers.get("x-appscout-admin");
  if (!adminToken || adminToken !== process.env.APPSCOUT_ADMIN_TOKEN) {
    return NextResponse.json({ error: "admin token required" }, { status: 401 });
  }
  const body = await req.json().catch(() => null) as { code?: string } | null;
  if (!body?.code) return NextResponse.json({ error: "code required" }, { status: 400 });
  const ok = revoke(body.code);
  return NextResponse.json({ ok });
}
