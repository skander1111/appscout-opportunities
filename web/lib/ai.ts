// Claude-powered intelligence layer.
// - generatePrediction: full AI analysis for one opportunity.
// - matchProfile: rank opportunities for a user profile.
// All calls are wrapped with prompt caching where it helps, and gracefully
// degrade to a deterministic fallback when ANTHROPIC_API_KEY is unset.

import Anthropic from "@anthropic-ai/sdk";
import type {
  Opportunity,
  AiPrediction,
  OpportunityAction,
} from "./opportunities";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";

function client(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

// ── Prompt: opportunity prediction ──────────────────────────────────

const PREDICTION_SYSTEM = `You are AppScout's senior deal-intelligence analyst.
You evaluate digital opportunities (abandoned apps, GitHub projects, seller posts, startup signals, user-submitted projects) and score them for a buyer/builder/partner.

For every opportunity you return ONE JSON object — no prose, no markdown — matching this exact shape:

{
  "opportunityScore": 0-100,
  "demandScore": 0-100,
  "moneyPotential": 0-100,
  "competitionRisk": 0-100,
  "buildDifficulty": 0-100,
  "acquisitionDifficulty": 0-100,
  "legalRisk": 0-100,
  "recommendedAction": "acquire"|"rebuild"|"partner"|"buy"|"sell"|"invest"|"watch"|"ignore",
  "whyNow": "1-2 sentence rationale citing the strongest single signal",
  "monetizationIdeas": ["3-5 concrete monetization angles"],
  "outreachDraft": "ready-to-send cold message, ~120 words, no placeholders, plain text",
  "dueDiligence": ["5-8 concrete checks before acting"]
}

Scoring guidance:
- opportunityScore is a composite. Strong demand + reachable owner + low legal risk = high.
- demandScore: installs, stars, reviews, traffic, MAU signals.
- moneyPotential: ad fit, IAP fit, subscription fit, B2B fit, transaction volume potential.
- buildDifficulty: complexity to rebuild from scratch.
- acquisitionDifficulty: how hard to buy — owner reachability, likely price, portfolio ownership.
- legalRisk: copyright (ringtones, wallpapers), data, platform policy, trademarks.
- competitionRisk: how crowded the niche is.

Be terse, specific, and operator-minded. No fluff.`;

const PREDICTION_USER_TEMPLATE = (o: Opportunity) =>
  `Opportunity to evaluate:

Source: ${o.source}
Kind: ${o.kind}
Title: ${o.title}
Niche: ${o.niche || "unknown"}
URL: ${o.url || "n/a"}
Description: ${o.description || "n/a"}
Installs: ${o.installs ?? "n/a"}
Stars: ${o.stars ?? "n/a"}
Days since update / posted: ${o.daysStale ?? "n/a"}
Rating: ${o.rating ?? "n/a"}
Owner: ${o.owner || "unknown"} (${o.ownerType || "unknown"})
Contact known: ${o.contact ? "yes" : "no"}
Asking / price: ${o.price || o.asking || "n/a"}
Legacy engine score: ${o.legacyScore ?? "n/a"}

Return JSON only.`;

// ── Deterministic fallback (no API key) ─────────────────────────────

function fallbackPrediction(o: Opportunity): AiPrediction {
  const days = o.daysStale ?? 0;
  const installs = o.installs ?? 0;
  const stars = o.stars ?? 0;

  const demandScore = Math.min(
    100,
    Math.round(
      installs > 0
        ? Math.log10(installs + 1) * 14
        : stars > 0
          ? Math.log10(stars + 1) * 18
          : 35,
    ),
  );

  const moneyPotential = o.niche === "Calculator" || o.niche === "PDF Tools"
    ? 80
    : o.kind === "github-stale"
      ? 55
      : 65;

  const acquisitionDifficulty = o.contact ? 30 : 60;
  const buildDifficulty = o.kind === "github-stale" ? 35 : 55;
  const legalRisk = o.niche?.toLowerCase().includes("ringtone") ? 75 : 25;
  const competitionRisk = installs > 1_000_000 ? 70 : 45;

  const opportunityScore = Math.round(
    demandScore * 0.35 +
    moneyPotential * 0.25 +
    (100 - acquisitionDifficulty) * 0.20 +
    (100 - legalRisk) * 0.10 +
    (100 - competitionRisk) * 0.10,
  );

  let action: OpportunityAction = "watch";
  if (o.kind === "abandoned-app" && opportunityScore >= 65) action = "acquire";
  else if (o.kind === "rebuild-target") action = "rebuild";
  else if (o.kind === "seller-lead") action = "buy";
  else if (o.kind === "partner-request") action = "partner";
  else if (o.kind === "github-stale") action = days >= 365 ? "acquire" : "rebuild";

  return {
    opportunityScore,
    demandScore,
    moneyPotential,
    competitionRisk,
    buildDifficulty,
    acquisitionDifficulty,
    legalRisk,
    recommendedAction: action,
    whyNow: o.daysStale
      ? `Asset has been stale for ${o.daysStale} days while still showing usage signals — typical window before competitors or brokers notice.`
      : `Signal is recent and underexploited — most operators won't see it for weeks.`,
    monetizationIdeas: [
      "Convert free → freemium with paywall on premium features",
      "Add subscription tier + remove ads for paying users",
      "Cross-sell related tools from the same niche",
      "B2B license / white-label to agencies",
    ],
    outreachDraft: `Hi ${o.owner || "there"},

I came across ${o.title} and noticed it hasn't been updated in a while. I'm exploring opportunities in the ${o.niche || "this"} space and your project caught my attention.

Would you be open to a short conversation about what's next for it — whether that's an acquisition, a partnership, or simply you handing over the keys to someone who'd keep it alive?

Happy to share what I have in mind. No pressure either way.

Best,`,
    dueDiligence: [
      "Verify owner identity and contact via second channel",
      "Pull last 90 days of reviews / issues to confirm user activity",
      "Check trademark + privacy policy for blocking issues",
      "Confirm revenue claims with a screen-share of analytics",
      "Run an installs/MAU sanity check against public estimators",
      "Check the asset is not already under offer or in escrow",
    ],
    generatedAt: new Date().toISOString(),
    modelId: "fallback",
  };
}

// ── Public: generate prediction ─────────────────────────────────────

export async function generatePrediction(o: Opportunity): Promise<AiPrediction> {
  const c = client();
  if (!c) return fallbackPrediction(o);

  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: PREDICTION_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: PREDICTION_USER_TEMPLATE(o) }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json in response");
    const parsed = JSON.parse(match[0]);

    return {
      opportunityScore: clamp(parsed.opportunityScore),
      demandScore: clamp(parsed.demandScore),
      moneyPotential: clamp(parsed.moneyPotential),
      competitionRisk: clamp(parsed.competitionRisk),
      buildDifficulty: clamp(parsed.buildDifficulty),
      acquisitionDifficulty: clamp(parsed.acquisitionDifficulty),
      legalRisk: clamp(parsed.legalRisk),
      recommendedAction: parsed.recommendedAction || "watch",
      whyNow: String(parsed.whyNow || ""),
      monetizationIdeas: Array.isArray(parsed.monetizationIdeas) ? parsed.monetizationIdeas.slice(0, 6) : [],
      outreachDraft: String(parsed.outreachDraft || ""),
      dueDiligence: Array.isArray(parsed.dueDiligence) ? parsed.dueDiligence.slice(0, 10) : [],
      generatedAt: new Date().toISOString(),
      modelId: "appscout-v1",
    };
  } catch (err) {
    console.error("[ai] prediction failed, using fallback:", err);
    const fb = fallbackPrediction(o);
    return { ...fb, modelId: "appscout-v1-fallback" };
  }
}

// ── Public: profile match ───────────────────────────────────────────

export interface UserProfile {
  goal: "buy" | "build" | "partner" | "invest" | "sell";
  budget: string;        // "<1k" | "1k-5k" | "5k-25k" | "25k+"
  skills: string[];      // e.g. ["react", "ios", "ml"]
  niches: string[];      // preferred niches
  country?: string;
  technicalLevel: "non-technical" | "junior" | "experienced" | "expert";
}

export interface MatchResult {
  opportunityId: string;
  fitScore: number;        // 0-100
  rationale: string;       // 1-2 sentence reason
}

const MATCH_SYSTEM = `You are AppScout's profile matcher. Given a user profile and a list of opportunities, score how well each fits the user (0-100) and write a one-sentence reason.

Return JSON only — an array of {opportunityId, fitScore, rationale}. No prose. No markdown. Sort by fitScore descending.

Reasoning:
- A user with "buy" goal + tiny budget should not be matched to expensive seller leads.
- A non-technical user gets a penalty on high-buildDifficulty items.
- Niche overlap is a strong positive.
- Skill overlap is a moderate positive.`;

export async function matchProfile(
  profile: UserProfile,
  opportunities: Opportunity[],
): Promise<MatchResult[]> {
  const c = client();
  if (!c) return localMatch(profile, opportunities);

  try {
    const compact = opportunities.slice(0, 60).map((o) => ({
      id: o.id,
      title: o.title,
      kind: o.kind,
      niche: o.niche,
      installs: o.installs,
      stars: o.stars,
      daysStale: o.daysStale,
      price: o.price || o.asking,
      buildDifficulty: o.ai?.buildDifficulty,
      moneyPotential: o.ai?.moneyPotential,
    }));

    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: [
        { type: "text", text: MATCH_SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      messages: [
        {
          role: "user",
          content: `Profile:
${JSON.stringify(profile)}

Opportunities:
${JSON.stringify(compact)}

Return JSON array of matches.`,
        },
      ],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("no array");
    const parsed = JSON.parse(match[0]) as MatchResult[];
    return parsed
      .filter((m) => m.opportunityId && typeof m.fitScore === "number")
      .map((m) => ({ ...m, fitScore: clamp(m.fitScore) }))
      .sort((a, b) => b.fitScore - a.fitScore);
  } catch (err) {
    console.error("[ai] match failed, using local:", err);
    return localMatch(profile, opportunities);
  }
}

function localMatch(profile: UserProfile, opps: Opportunity[]): MatchResult[] {
  return opps
    .map((o) => {
      let score = 40;
      const reasons: string[] = [];
      if (profile.niches.some((n) => (o.niche || "").toLowerCase().includes(n.toLowerCase()))) {
        score += 25;
        reasons.push("niche match");
      }
      if (profile.goal === "buy" && (o.kind === "seller-lead" || o.kind === "abandoned-app")) {
        score += 20;
        reasons.push("matches buy intent");
      }
      if (profile.goal === "build" && o.kind === "rebuild-target") {
        score += 20;
        reasons.push("rebuild fit");
      }
      if (profile.technicalLevel === "non-technical" && (o.ai?.buildDifficulty ?? 50) > 60) {
        score -= 25;
        reasons.push("build difficulty too high for non-technical profile");
      }
      if (profile.budget === "<1k" && /\$\s*\d{1,2},?\d{3,}/.test(o.price || "")) {
        score -= 20;
        reasons.push("price likely above budget");
      }
      return {
        opportunityId: o.id,
        fitScore: clamp(score),
        rationale: reasons.length ? reasons.join("; ") : "Baseline fit",
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}

function clamp(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export { fallbackPrediction };

// ── Public: natural-language search ─────────────────────────────────

export interface SearchFilter {
  kinds?: string[];        // OpportunityKind[]
  sources?: string[];      // OpportunitySource[]
  niches?: string[];
  minInstalls?: number;
  maxInstalls?: number;
  minDaysStale?: number;
  maxDaysStale?: number;
  maxPrice?: number;       // in USD
  needsContact?: boolean;
  needsRebuild?: boolean;
  needsAcquire?: boolean;
}

export interface SearchResult {
  filter: SearchFilter;
  ranking: { opportunityId: string; relevance: number; reason: string }[];
}

const SEARCH_SYSTEM = `You are AppScout's deal-intelligence search engine.
Given a natural-language query AND a list of opportunities, do two things in one JSON output:

1. Extract a filter object from the query into "filter".
2. Rank the opportunities by relevance to the query (0-100) into "ranking", sorted by relevance desc.

Return ONE JSON object only:
{
  "filter": {
    "kinds": ["abandoned-app"|"rebuild-target"|"github-stale"|"seller-lead"|"startup-signal"|"partner-request"|"user-submission"],
    "sources": ["googleplay"|"appstore"|"github"|"reddit"|"hackernews"|"producthunt"|"submission"],
    "niches": [],
    "minInstalls": number | null,
    "maxInstalls": number | null,
    "minDaysStale": number | null,
    "maxDaysStale": number | null,
    "maxPrice": number | null,
    "needsContact": boolean | null,
    "needsRebuild": boolean | null,
    "needsAcquire": boolean | null
  },
  "ranking": [
    { "opportunityId": "string", "relevance": 0-100, "reason": "1-sentence why this matches" }
  ]
}

Only include the top 12 matches in ranking. Skip irrelevant items. No prose, no markdown.`;

export async function searchOpportunities(
  query: string,
  opportunities: Opportunity[],
): Promise<SearchResult> {
  const c = client();
  if (!c) return { filter: {}, ranking: opportunities.slice(0, 12).map((o) => ({ opportunityId: o.id, relevance: 50, reason: "fallback" })) };

  try {
    const compact = opportunities.slice(0, 80).map((o) => ({
      id: o.id,
      title: o.title,
      kind: o.kind,
      source: o.source,
      niche: o.niche,
      installs: o.installs,
      stars: o.stars,
      daysStale: o.daysStale,
      hasContact: !!o.contact,
      price: o.price,
    }));

    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: [{ type: "text", text: SEARCH_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Query: ${query}\n\nOpportunities:\n${JSON.stringify(compact)}\n\nReturn JSON.`,
        },
      ],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    return JSON.parse(match[0]) as SearchResult;
  } catch (err) {
    console.error("[ai] search failed:", err);
    return { filter: {}, ranking: opportunities.slice(0, 12).map((o) => ({ opportunityId: o.id, relevance: 50, reason: "fallback" })) };
  }
}

// ── Public: ROI simulator ───────────────────────────────────────────

export interface RoiInput {
  askingPriceUsd: number;
  monthlyMaintenanceHours?: number;
}

export interface RoiResult {
  rebuildCostUsd: { low: number; high: number };
  monthlyRevenueUsd: { low: number; mid: number; high: number };
  twelveMonthRevenueUsd: number;
  breakevenMonths: number;
  roiPctYear1: number;
  assumptions: string[];
  risks: string[];
}

const ROI_SYSTEM = `You are AppScout's deal-modelling analyst.
Given one opportunity and an asking price, produce a ROI estimate.

Output ONE JSON object only:
{
  "rebuildCostUsd": { "low": number, "high": number },
  "monthlyRevenueUsd": { "low": number, "mid": number, "high": number },
  "twelveMonthRevenueUsd": number,
  "breakevenMonths": number,
  "roiPctYear1": number,
  "assumptions": ["3-5 concrete assumptions"],
  "risks": ["2-4 things that could break the model"]
}

Be honest. If the opportunity is weak, the numbers should reflect that. Round revenue to nearest $50. No prose.`;

export async function simulateRoi(o: Opportunity, input: RoiInput): Promise<RoiResult> {
  const c = client();
  if (!c) return fallbackRoi(o, input);

  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: [{ type: "text", text: ROI_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Opportunity:
Title: ${o.title}
Kind: ${o.kind}
Niche: ${o.niche || "unknown"}
Installs: ${o.installs ?? "n/a"}
Stars: ${o.stars ?? "n/a"}
Days stale: ${o.daysStale ?? "n/a"}
Rating: ${o.rating ?? "n/a"}
Owner type: ${o.ownerType || "unknown"}
Description: ${o.description || "n/a"}
AI prior: opportunity ${o.ai?.opportunityScore ?? "n/a"}, demand ${o.ai?.demandScore ?? "n/a"}, money ${o.ai?.moneyPotential ?? "n/a"}

Asking price: $${input.askingPriceUsd}
Monthly maintenance hours estimate: ${input.monthlyMaintenanceHours ?? 8}

Return JSON.`,
        },
      ],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    return JSON.parse(match[0]) as RoiResult;
  } catch (err) {
    console.error("[ai] roi failed:", err);
    return fallbackRoi(o, input);
  }
}

function fallbackRoi(o: Opportunity, input: RoiInput): RoiResult {
  const installs = o.installs ?? 50_000;
  const moneyMult = (o.ai?.moneyPotential ?? 50) / 100;
  const monthlyLow = Math.round((installs * 0.001 * moneyMult) / 50) * 50;
  const monthlyMid = Math.round((installs * 0.0025 * moneyMult) / 50) * 50;
  const monthlyHigh = Math.round((installs * 0.006 * moneyMult) / 50) * 50;
  const twelveMonth = monthlyMid * 12;
  const rebuildCostLow = 2000;
  const rebuildCostHigh = 12000;
  const breakeven = Math.max(1, Math.round((input.askingPriceUsd + (rebuildCostLow + rebuildCostHigh) / 2) / Math.max(monthlyMid, 50)));
  const roi = Math.round(((twelveMonth - input.askingPriceUsd - (rebuildCostLow + rebuildCostHigh) / 2) / Math.max(input.askingPriceUsd, 1)) * 100);
  return {
    rebuildCostUsd: { low: rebuildCostLow, high: rebuildCostHigh },
    monthlyRevenueUsd: { low: monthlyLow, mid: monthlyMid, high: monthlyHigh },
    twelveMonthRevenueUsd: twelveMonth,
    breakevenMonths: breakeven,
    roiPctYear1: roi,
    assumptions: [
      "Ad RPM in $1-3 range, IAP take ~5-8%",
      "Active user fraction ~10-15% of installs",
      "Maintenance handled in-house, no hosting beyond ad SDK",
    ],
    risks: [
      "Installs estimate may overstate active users",
      "Platform policy changes can wipe ad revenue overnight",
    ],
  };
}

// ── Public: app-of-the-day deep dive ────────────────────────────────

export interface DeepDive {
  opportunityId: string;
  title: string;
  summary: string;
  ownerBackground: string;
  revenueEstimate: string;
  whyNow: string;
  rebuildPlan: string;
  outreachPlan: string;
  redFlags: string[];
  generatedAt: string;
}

const DEEPDIVE_SYSTEM = `You are AppScout's editorial deal analyst.
Given one opportunity, write a deep-dive investigation as ONE JSON object (no prose, no markdown):

{
  "summary": "2-3 sentence executive summary",
  "ownerBackground": "what we can infer about the owner from public signals (~80 words)",
  "revenueEstimate": "honest estimate range with reasoning (~100 words)",
  "whyNow": "why this opportunity is timely (~80 words)",
  "rebuildPlan": "step-by-step rebuild plan, 4-6 bullets joined with '\\n'. Concrete.",
  "outreachPlan": "negotiation playbook: opener, leverage, walk-away point. ~120 words.",
  "redFlags": ["3-5 things to verify before acting"]
}

Operator voice. No fluff. No emoji.`;

export async function generateDeepDive(o: Opportunity): Promise<DeepDive> {
  const c = client();
  const skeleton: DeepDive = {
    opportunityId: o.id,
    title: o.title,
    summary: "Auto-generated stub — set ANTHROPIC_API_KEY to get a real investigation.",
    ownerBackground: "—",
    revenueEstimate: "—",
    whyNow: o.ai?.whyNow || "—",
    rebuildPlan: "—",
    outreachPlan: "—",
    redFlags: o.ai?.dueDiligence ?? [],
    generatedAt: new Date().toISOString(),
  };
  if (!c) return skeleton;

  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 2200,
      system: [{ type: "text", text: DEEPDIVE_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Opportunity:
${JSON.stringify({
  title: o.title,
  kind: o.kind,
  source: o.source,
  niche: o.niche,
  installs: o.installs,
  stars: o.stars,
  daysStale: o.daysStale,
  rating: o.rating,
  owner: o.owner,
  ownerType: o.ownerType,
  description: o.description,
  ai: o.ai,
}, null, 2)}

Return JSON.`,
        },
      ],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("no json");
    const parsed = JSON.parse(m[0]);
    return {
      opportunityId: o.id,
      title: o.title,
      summary: String(parsed.summary || ""),
      ownerBackground: String(parsed.ownerBackground || ""),
      revenueEstimate: String(parsed.revenueEstimate || ""),
      whyNow: String(parsed.whyNow || ""),
      rebuildPlan: String(parsed.rebuildPlan || ""),
      outreachPlan: String(parsed.outreachPlan || ""),
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.slice(0, 8) : [],
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[ai] deep dive failed:", err);
    return skeleton;
  }
}
