export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { loadAllOpportunities } from "@/lib/loadOpportunities";
import { matchProfile, type UserProfile } from "@/lib/ai";
import { requireLicense } from "@/lib/license";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Partial<UserProfile> | null;
  if (!body || !body.goal) {
    return NextResponse.json({ error: "profile.goal required" }, { status: 400 });
  }

  const license = await requireLicense(req, "match", 2); // heavier op
  if (!license.ok) return NextResponse.json(license.body, { status: license.status });

  const profile: UserProfile = {
    goal: body.goal,
    budget: body.budget || "1k-5k",
    skills: Array.isArray(body.skills) ? body.skills.slice(0, 12) : [],
    niches: Array.isArray(body.niches) ? body.niches.slice(0, 8) : [],
    country: body.country,
    technicalLevel: body.technicalLevel || "experienced",
  };

  const opportunities = loadAllOpportunities({ limit: 60 });
  const matches = await matchProfile(profile, opportunities);

  const byId = new Map(opportunities.map((o) => [o.id, o]));
  const top = matches.slice(0, 12).map((m) => ({
    ...m,
    opportunity: byId.get(m.opportunityId),
  }));

  return NextResponse.json({ matches: top, profile, quotaRemaining: license.remaining });
}
