// Live visitor counter. Persists in Firestore (REST API, test-mode rules) when
// FIREBASE_PROJECT_ID is set, otherwise returns the seed value 548 so the UI
// still works in dev / before the env var is wired.
//
// Storage model: single document /site/stats with field { count: <integer> }.
// First visit ever creates the doc seeded at 548 + 1.

import { NextRequest, NextResponse } from "next/server";

const SEED = 548;
const COOKIE = "visited";
const PROJECT = process.env.FIREBASE_PROJECT_ID;

const DOC_URL = PROJECT
  ? `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/site/stats`
  : "";

async function readCount(): Promise<number> {
  if (!DOC_URL) return SEED;
  try {
    const res = await fetch(DOC_URL, { cache: "no-store" });
    if (res.status === 404) return SEED;
    if (!res.ok) return SEED;
    const data = await res.json();
    const v = data.fields?.count?.integerValue ?? data.fields?.count?.doubleValue;
    return v != null ? Number(v) : SEED;
  } catch {
    return SEED;
  }
}

async function writeCount(value: number): Promise<boolean> {
  if (!DOC_URL) return false;
  try {
    // PATCH creates-or-updates with updateMask=count
    const res = await fetch(`${DOC_URL}?updateMask.fieldPaths=count`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { count: { integerValue: String(value) } } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const count = await readCount();
  return NextResponse.json({ count, persisted: Boolean(PROJECT) });
}

export async function POST(req: NextRequest) {
  // Dedupe by cookie — same browser only increments once per 90 days.
  const already = req.cookies.get(COOKIE)?.value === "1";
  let count = await readCount();

  if (!already) {
    count = Math.max(SEED + 1, count + 1);
    await writeCount(count);
  }

  const res = NextResponse.json({ count, counted: !already, persisted: Boolean(PROJECT) });
  if (!already) {
    res.cookies.set(COOKIE, "1", {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
  }
  return res;
}
