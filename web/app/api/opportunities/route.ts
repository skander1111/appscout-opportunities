export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const sort = searchParams.get('sort') || 'score';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const filePath = path.join(process.cwd(), 'data', 'opportunities.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ apps: [], meta: { total: 0 } });
    }

    const SKIP_CLASSIFICATIONS = new Set(['Active — skip', 'Ignore', 'Too small']);
    let apps: any[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    apps = apps.filter((a: any) => !a.disqualified && !SKIP_CLASSIFICATIONS.has(a.classification));

    if (type === 'acquisition') apps = apps.filter((a: any) => a.daysSinceUpdate >= 365);
    else if (type === 'rebuild') apps = apps.filter((a: any) => a.daysSinceUpdate >= 180 && a.daysSinceUpdate < 365);
    else if (type === 'watch') apps = apps.filter((a: any) => a.daysSinceUpdate >= 120 && a.daysSinceUpdate < 180);

    if (sort === 'score') apps.sort((a: any, b: any) => b.opportunityScore - a.opportunityScore);
    else if (sort === 'stale') apps.sort((a: any, b: any) => b.daysSinceUpdate - a.daysSinceUpdate);
    else if (sort === 'installs') apps.sort((a: any, b: any) => (b.minInstalls || 0) - (a.minInstalls || 0));

    const metaPath = path.join(process.cwd(), 'data', 'meta.json');
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};

    return NextResponse.json({
      apps: apps.slice(0, limit),
      meta: { total: apps.length, lastUpdated: meta.lastUpdated, appsScored: meta.appsScored },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
