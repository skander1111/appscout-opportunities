// Server-side loader that unifies all sources into a single Opportunity feed.
// Reads JSON files in web/data, applies the same disqualification rules used by
// the legacy engine, and stitches in cached AI predictions when available.

import fs from "fs";
import path from "path";
import {
  appToOpportunity,
  githubToOpportunity,
  sellerLeadToOpportunity,
  signalToOpportunity,
  submissionToOpportunity,
  type Opportunity,
  type AiPrediction,
  type RawSubmission,
} from "./opportunities";

const DATA_DIR = path.join(process.cwd(), "data");

const SKIP_CLASSIFICATIONS = new Set([
  "Active — skip",
  "Ignore",
  "Too small",
  "False positive",
]);

function readJson<T>(file: string, fallback: T): T {
  try {
    const full = path.join(DATA_DIR, file);
    if (!fs.existsSync(full)) return fallback;
    return JSON.parse(fs.readFileSync(full, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function loadAiCache(): Record<string, AiPrediction> {
  return readJson<Record<string, AiPrediction>>("ai-predictions.json", {});
}

interface LoadOptions {
  kinds?: string[];
  limit?: number;
}

export function loadAllOpportunities(opts: LoadOptions = {}): Opportunity[] {
  const apps = readJson<any[]>("opportunities.json", []);
  const githubProjects = readJson<any[]>("github-projects.json", []);
  const sellerLeads = readJson<any[]>("seller-leads.json", []);
  const signals = readJson<any[]>("signals.json", []);
  const submissions = readJson<RawSubmission[]>("submissions.json", []);
  const aiCache = loadAiCache();

  const appOpps = apps
    .filter((a) => !a.disqualified && !SKIP_CLASSIFICATIONS.has(a.classification))
    .map(appToOpportunity);

  const ghOpps = githubProjects.map(githubToOpportunity);
  const sellerOpps = sellerLeads.map(sellerLeadToOpportunity);
  const signalOpps = signals.map(signalToOpportunity);
  const subOpps = submissions.map(submissionToOpportunity);

  let all: Opportunity[] = [
    ...appOpps,
    ...ghOpps,
    ...sellerOpps,
    ...signalOpps,
    ...subOpps,
  ];

  // attach cached AI predictions
  all = all.map((o) => {
    const cached = aiCache[o.id];
    return cached ? { ...o, ai: cached } : o;
  });

  if (opts.kinds && opts.kinds.length > 0) {
    const set = new Set(opts.kinds);
    all = all.filter((o) => set.has(o.kind));
  }

  // primary sort: AI opportunityScore desc, fallback legacy, fallback daysStale
  all.sort((a, b) => {
    const av = a.ai?.opportunityScore ?? a.legacyScore ?? (a.daysStale ?? 0) / 10;
    const bv = b.ai?.opportunityScore ?? b.legacyScore ?? (b.daysStale ?? 0) / 10;
    return bv - av;
  });

  if (opts.limit) all = all.slice(0, opts.limit);
  return all;
}

export function loadSubmissions(): RawSubmission[] {
  return readJson<RawSubmission[]>("submissions.json", []);
}

export function saveSubmissions(submissions: RawSubmission[]) {
  const full = path.join(DATA_DIR, "submissions.json");
  fs.writeFileSync(full, JSON.stringify(submissions, null, 2));
}

export function saveAiCache(cache: Record<string, AiPrediction>) {
  const full = path.join(DATA_DIR, "ai-predictions.json");
  fs.writeFileSync(full, JSON.stringify(cache, null, 2));
}
