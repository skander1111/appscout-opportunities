export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const metaPath = path.join(process.cwd(), 'data', 'meta.json');
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
    return NextResponse.json(meta);
  } catch (e) {
    return NextResponse.json({});
  }
}
