export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const NOTES_FILE = path.join(process.cwd(), "data", "notes.json");

interface Note {
  id: string;
  opportunityId: string;
  author: string;
  text: string;
  createdAt: string;
}

function load(): Note[] {
  if (!fs.existsSync(NOTES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(NOTES_FILE, "utf8")); }
  catch { return []; }
}
function save(notes: Note[]) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const opportunityId = searchParams.get("opportunityId");
  const notes = load();
  const out = opportunityId ? notes.filter((n) => n.opportunityId === opportunityId) : notes;
  return NextResponse.json({ notes: out.slice(-200) });
}

function clip(s: unknown, n: number): string {
  return String(s ?? "").trim().slice(0, n);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const opportunityId = clip(body.opportunityId, 200);
  const author = clip(body.author, 40) || "anonymous";
  const text = clip(body.text, 600);

  if (!opportunityId) return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  if (text.length < 2) return NextResponse.json({ error: "text too short" }, { status: 400 });

  // crude spam guard
  if (/(https?:\/\/[^\s]{40,})/i.test(text) && !/github\.com|play\.google|apps\.apple|reddit\.com/.test(text)) {
    return NextResponse.json({ error: "links not allowed (allowed domains: github, play store, app store, reddit)" }, { status: 400 });
  }

  const notes = load();
  const note: Note = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    opportunityId,
    author,
    text,
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  save(notes);
  return NextResponse.json({ ok: true, note });
}
