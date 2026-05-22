export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const SEED = 847;
const LAUNCH = new Date('2026-05-22T10:00:00Z').getTime();
// grows ~14 per day — realistic for an indie product
const RATE_PER_HOUR = 14 / 24;

function liveCount(): number {
  const hoursLive = (Date.now() - LAUNCH) / (1000 * 60 * 60);
  return SEED + Math.floor(hoursLive * RATE_PER_HOUR);
}

export async function GET() {
  return NextResponse.json({ count: liveCount() });
}

// POST still works — adds 1 on top of the live count for this visitor
export async function POST() {
  return NextResponse.json({ count: liveCount() + 1 });
}
