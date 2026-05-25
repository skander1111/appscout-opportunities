export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getStatus, readLicenseCookie, clearLicenseCookieHeader } from "@/lib/license";

export async function GET(req: NextRequest) {
  const code = readLicenseCookie(req);
  const status = getStatus(code);
  return NextResponse.json({ ...status, code: status.valid ? code : undefined });
}

export async function DELETE() {
  // sign out — clear cookie
  const res = NextResponse.json({ ok: true, signedOut: true });
  res.headers.append("Set-Cookie", clearLicenseCookieHeader());
  return res;
}
