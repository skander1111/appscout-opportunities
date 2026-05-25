export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { loadSubmissions, saveSubmissions } from "@/lib/loadOpportunities";
import type { RawSubmission } from "@/lib/opportunities";

const VALID_STAGES = new Set(["idea", "mvp", "launched", "abandoned", "for-sale"]);
const VALID_ASKING = new Set(["buyer", "partner", "builder", "investor", "feedback"]);

export async function GET() {
  const submissions = loadSubmissions();
  // hide raw contact when listed publicly
  const sanitized = submissions.map((s) => {
    const [user, domain] = (s.contact || "").split("@");
    const blurredContact = domain
      ? `${user.slice(0, 2)}•••@${domain}`
      : "—";
    return { ...s, contact: blurredContact };
  });
  return NextResponse.json({ submissions: sanitized });
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

function clip(s: unknown, n: number): string {
  return String(s ?? "").trim().slice(0, n);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Partial<RawSubmission> | null;
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const projectName = clip(body.projectName, 100);
  const description = clip(body.description, 1200);
  const stage = String(body.stage || "");
  const platform = clip(body.platform, 60);
  const asking = String(body.asking || "");
  const price = clip(body.price, 30);
  const contact = clip(body.contact, 120);
  const url = clip(body.url, 200);
  const github = clip(body.github, 200);

  if (projectName.length < 2) return NextResponse.json({ error: "projectName required" }, { status: 400 });
  if (description.length < 20) return NextResponse.json({ error: "description too short (min 20 chars)" }, { status: 400 });
  if (!VALID_STAGES.has(stage)) return NextResponse.json({ error: "invalid stage" }, { status: 400 });
  if (!VALID_ASKING.has(asking)) return NextResponse.json({ error: "invalid asking" }, { status: 400 });
  if (!isEmail(contact)) return NextResponse.json({ error: "invalid email" }, { status: 400 });

  const submission: RawSubmission = {
    id: genId(),
    projectName,
    description,
    stage: stage as RawSubmission["stage"],
    platform,
    asking: asking as RawSubmission["asking"],
    price: price || undefined,
    contact,
    url: url || undefined,
    github: github || undefined,
    createdAt: new Date().toISOString(),
  };

  const all = loadSubmissions();
  all.unshift(submission);
  saveSubmissions(all);

  return NextResponse.json({ ok: true, submission: { ...submission, contact: "saved privately" } });
}
