export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'counter.json');

function read(): number {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8')).count || 847;
  } catch {
    return 847;
  }
}

function write(n: number) {
  fs.writeFileSync(FILE, JSON.stringify({ count: n }));
}

export async function GET() {
  return NextResponse.json({ count: read() });
}

export async function POST() {
  const next = read() + 1;
  write(next);
  return NextResponse.json({ count: next });
}
