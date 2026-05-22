export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'github-projects.json');
    if (!fs.existsSync(filePath)) return NextResponse.json({ projects: [] });
    const projects = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return NextResponse.json({ projects });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
