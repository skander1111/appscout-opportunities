export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { loadAllOpportunities } from "@/lib/loadOpportunities";
import { getStatus, readLicenseCookie } from "@/lib/license";
import { blurContact, type Opportunity } from "@/lib/opportunities";

// Server-side gating: unlicensed clients see only the "headline" AI fields
// (opportunityScore + recommendedAction). Everything else is stripped.
function publicView(o: Opportunity): Opportunity {
  if (!o.ai) return o;
  return {
    ...o,
    contact: o.contact ? blurContact(o.contact) : undefined,
    ai: {
      opportunityScore: o.ai.opportunityScore,
      demandScore: 0,
      moneyPotential: 0,
      competitionRisk: 0,
      buildDifficulty: 0,
      acquisitionDifficulty: 0,
      legalRisk: 0,
      recommendedAction: o.ai.recommendedAction,
      whyNow: "",
      monetizationIdeas: [],
      outreachDraft: "",
      dueDiligence: [],
      generatedAt: o.ai.generatedAt,
      modelId: "",
    },
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kinds = searchParams.get("kinds")?.split(",").filter(Boolean) ?? [];
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

  const all = loadAllOpportunities({
    kinds: kinds.length ? kinds : undefined,
    limit,
  });

  const code = readLicenseCookie(req);
  const license = getStatus(code);
  const unlocked = license.valid;

  const exposed = unlocked ? all : all.map(publicView);

  return NextResponse.json({
    opportunities: exposed,
    license: { valid: unlocked, tier: license.tier, quotaRemaining: license.quotaRemaining },
    meta: { total: all.length, generatedAt: new Date().toISOString() },
  });
}
