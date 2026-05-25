// Unified Opportunity schema covering all sources.
// One shape, many sources — feeds dashboard, terminal, report, AI predictor.

export type OpportunitySource =
  | "googleplay"
  | "appstore"
  | "github"
  | "reddit"
  | "hackernews"
  | "producthunt"
  | "indiehackers"
  | "news"
  | "threads"
  | "submission";

export type OpportunityAction =
  | "acquire"
  | "rebuild"
  | "partner"
  | "buy"
  | "sell"
  | "invest"
  | "watch"
  | "ignore";

export type OpportunityKind =
  | "abandoned-app"
  | "rebuild-target"
  | "github-stale"
  | "seller-lead"
  | "startup-signal"
  | "partner-request"
  | "user-submission";

export interface AiPrediction {
  opportunityScore: number;      // 0-100 — composite
  demandScore: number;           // 0-100 — proven demand
  moneyPotential: number;        // 0-100 — monetization upside
  competitionRisk: number;       // 0-100 — higher = more competition
  buildDifficulty: number;       // 0-100 — higher = harder to build
  acquisitionDifficulty: number; // 0-100 — higher = harder to acquire
  legalRisk: number;             // 0-100 — higher = more risky
  recommendedAction: OpportunityAction;
  whyNow: string;                // 1-2 sentences
  monetizationIdeas: string[];   // 2-4 ideas
  outreachDraft: string;         // copy-paste cold email
  dueDiligence: string[];        // checklist
  generatedAt: string;           // ISO timestamp
  modelId: string;               // model used
}

export interface Opportunity {
  id: string;
  source: OpportunitySource;
  kind: OpportunityKind;
  title: string;
  description?: string;
  url?: string;
  niche?: string;
  // engagement / signals
  installs?: number;
  stars?: number;
  daysStale?: number;
  rating?: number;
  // owner / contact
  owner?: string;
  ownerType?: string;
  contact?: string;
  // marketplace
  asking?: string;
  price?: string;
  // engine-level score from legacy scorer (0-100)
  legacyScore?: number;
  // AI layer (lazy)
  ai?: AiPrediction;
  // metadata
  addedAt: string;
  raw?: unknown; // original payload for debugging
}

// ── Mappers ─────────────────────────────────────────────────────────

interface RawApp {
  appId: string;
  title: string;
  url?: string;
  niche?: string;
  developer?: string;
  developerEmail?: string;
  ownerType?: string;
  installs?: string;
  minInstalls?: number;
  score?: number;
  daysSinceUpdate?: number;
  opportunityScore?: number;
  classification?: string;
  platform?: string;
  mainComplaints?: string[];
}

export function appToOpportunity(a: RawApp): Opportunity {
  const days = a.daysSinceUpdate ?? 0;
  const kind: OpportunityKind = days >= 365 ? "abandoned-app" : "rebuild-target";
  return {
    id: `app-${a.platform || "android"}-${a.appId}`,
    source: a.platform === "ios" ? "appstore" : "googleplay",
    kind,
    title: a.title,
    description: a.mainComplaints?.join(", "),
    url: a.url,
    niche: a.niche,
    installs: a.minInstalls,
    daysStale: days,
    rating: a.score,
    owner: a.developer,
    ownerType: a.ownerType,
    contact: a.developerEmail,
    legacyScore: a.opportunityScore,
    addedAt: new Date().toISOString(),
    raw: a,
  };
}

interface RawGithub {
  name: string;
  fullName: string;
  description?: string;
  url: string;
  stars?: number;
  language?: string;
  topics?: string[];
  pushedAt?: string;
  daysSincePush?: number;
  owner?: string;
  ownerType?: string;
  classification?: string;
}

export function githubToOpportunity(g: RawGithub): Opportunity {
  return {
    id: `gh-${g.fullName.replace("/", "-")}`,
    source: "github",
    kind: "github-stale",
    title: g.name,
    description: g.description,
    url: g.url,
    niche: g.topics?.[0],
    stars: g.stars,
    daysStale: g.daysSincePush,
    owner: g.owner,
    ownerType: g.ownerType,
    addedAt: new Date().toISOString(),
    raw: g,
  };
}

interface RawSellerLead {
  id: number;
  title: string;
  appName?: string;
  subreddit?: string;
  url: string;
  author?: string;
  daysAgo?: number;
  askingPrice?: string;
  classification?: string;
  notes?: string;
}

export function sellerLeadToOpportunity(l: RawSellerLead): Opportunity {
  return {
    id: `seller-${l.id}`,
    source: "reddit",
    kind: "seller-lead",
    title: l.appName || l.title,
    description: l.notes,
    url: l.url,
    daysStale: l.daysAgo,
    owner: l.author,
    asking: l.askingPrice,
    price: l.askingPrice,
    addedAt: new Date().toISOString(),
    raw: l,
  };
}

interface RawSignal {
  id: string;
  source:
    | "hackernews"
    | "reddit"
    | "producthunt"
    | "indiehackers"
    | "news"
    | "threads";
  title: string;
  url: string;
  points?: number;
  daysAgo?: number;
  summary?: string;
  classification?: string;
  niche?: string;
}

export function signalToOpportunity(s: RawSignal): Opportunity {
  return {
    id: `sig-${s.id}`,
    source: s.source,
    kind: "startup-signal",
    title: s.title,
    description: s.summary,
    url: s.url,
    niche: s.niche,
    daysStale: s.daysAgo,
    addedAt: new Date().toISOString(),
    raw: s,
  };
}

export interface RawSubmission {
  id: string;
  projectName: string;
  description: string;
  stage: "idea" | "mvp" | "launched" | "abandoned" | "for-sale";
  platform: string;
  asking: "buyer" | "partner" | "builder" | "investor" | "feedback";
  price?: string;
  contact: string;
  url?: string;
  github?: string;
  createdAt: string;
}

export function submissionToOpportunity(s: RawSubmission): Opportunity {
  const askingMap: Record<string, OpportunityKind> = {
    buyer: "user-submission",
    partner: "partner-request",
    builder: "user-submission",
    investor: "user-submission",
    feedback: "user-submission",
  };
  return {
    id: `sub-${s.id}`,
    source: "submission",
    kind: askingMap[s.asking] || "user-submission",
    title: s.projectName,
    description: s.description,
    url: s.url || s.github,
    contact: s.contact,
    price: s.price,
    asking: s.asking,
    ownerType: s.stage,
    addedAt: s.createdAt,
    raw: s,
  };
}

// ── Premium gating helpers ──────────────────────────────────────────

export type AccessTier = "free" | "report" | "monthly" | "yearly";

export interface AccessRules {
  showFullContact: boolean;
  showAiPrediction: boolean;
  showAdvancedAi: boolean;     // legalRisk, acquisitionDifficulty, outreachDraft
  showProfileMatch: boolean;
  maxCardsVisible: number;
}

export function accessFor(tier: AccessTier): AccessRules {
  switch (tier) {
    case "yearly":
      return { showFullContact: true, showAiPrediction: true, showAdvancedAi: true,  showProfileMatch: true,  maxCardsVisible: Infinity };
    case "monthly":
      return { showFullContact: true, showAiPrediction: true, showAdvancedAi: false, showProfileMatch: false, maxCardsVisible: Infinity };
    case "report":
      return { showFullContact: true, showAiPrediction: false, showAdvancedAi: false, showProfileMatch: false, maxCardsVisible: 30 };
    default:
      return { showFullContact: false, showAiPrediction: false, showAdvancedAi: false, showProfileMatch: false, maxCardsVisible: 6 };
  }
}

export function blurContact(email?: string): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return "•••••••";
  return `${user.slice(0, 3)}${"•".repeat(Math.max(3, user.length - 3))}@${domain}`;
}
