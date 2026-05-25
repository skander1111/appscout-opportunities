// AppScout Weekly Intelligence Report — Friday 08:00
// Builds a clean markdown report with sections A–G:
//   A. Hidden app acquisition targets
//   B. Rebuild opportunities
//   C. GitHub unfinished projects
//   D. Public seller leads
//   E. Startup / news / trend signals
//   F. Project marketplace submissions
//   G. AI predictions + money potential
//
// Reads from web/data/*.json and web/data/ai-predictions.json.
// Writes to web/private/reports/week-NNN-report.md + latest-report.md.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const WEB_DATA = path.join(ROOT, 'web', 'data');
const REPORTS_DIR = path.join(ROOT, 'web', 'private', 'reports');

function readJson(file, fallback) {
  const full = path.join(WEB_DATA, file);
  if (!fs.existsSync(full)) return fallback;
  try { return JSON.parse(fs.readFileSync(full, 'utf8')); }
  catch { return fallback; }
}

const SKIP = new Set(['Active — skip', 'Ignore', 'Too small', 'False positive']);

const apps = readJson('opportunities.json', []).filter(a => !a.disqualified && !SKIP.has(a.classification));
const github = readJson('github-projects.json', []);
const leads = readJson('seller-leads.json', []);
const signals = readJson('signals.json', []);
const submissions = readJson('submissions.json', []);
const ai = readJson('ai-predictions.json', {});

const today = new Date();
const isoDate = today.toISOString().split('T')[0];

function week() {
  const start = new Date(today.getFullYear(), 0, 1);
  return Math.ceil((((today - start) / 86400000) + start.getDay() + 1) / 7);
}
const WEEK = week();

function aiId(prefix, idPart) { return ai[`${prefix}${idPart}`]; }

function aiBlock(prefix, idPart) {
  const a = aiId(prefix, idPart);
  if (!a) return '';
  const lines = [];
  lines.push(`  - **AI scores:** opportunity ${a.opportunityScore} · demand ${a.demandScore} · money ${a.moneyPotential} · acquire-diff ${a.acquisitionDifficulty} · build-diff ${a.buildDifficulty} · legal ${a.legalRisk} · competition ${a.competitionRisk}`);
  lines.push(`  - **Recommended action:** \`${a.recommendedAction}\``);
  lines.push(`  - **Why now:** ${a.whyNow}`);
  if (a.monetizationIdeas?.length) lines.push(`  - **Monetization:** ${a.monetizationIdeas.slice(0, 3).join(' · ')}`);
  return lines.join('\n');
}

// ── A. Hidden app acquisition targets ──────────────────────────────
const acqApps = apps
  .filter(a => (a.daysSinceUpdate ?? 0) >= 365 && a.developerEmail)
  .sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))
  .slice(0, 10);

// ── B. Rebuild opportunities ──────────────────────────────────────
const rebuildApps = apps
  .filter(a => (a.daysSinceUpdate ?? 0) >= 180 && (a.daysSinceUpdate ?? 0) < 365)
  .sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))
  .slice(0, 8);

// ── C. GitHub projects ────────────────────────────────────────────
const ghStale = [...github]
  .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
  .slice(0, 8);

// ── D. Seller leads ───────────────────────────────────────────────
const sellerLeads = [...leads]
  .sort((a, b) => (a.daysAgo ?? 9999) - (b.daysAgo ?? 9999))
  .slice(0, 8);

// ── E. Signals ────────────────────────────────────────────────────
const signalSet = [...signals]
  .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
  .slice(0, 8);

// ── F. Marketplace submissions ────────────────────────────────────
const subs = [...submissions].slice(0, 8);

// ── G. AI top picks ───────────────────────────────────────────────
const aiRanked = Object.entries(ai)
  .map(([id, v]) => ({ id, ...v }))
  .sort((a, b) => b.opportunityScore - a.opportunityScore)
  .slice(0, 8);

// ── Markdown ──────────────────────────────────────────────────────

const lines = [];
lines.push(`# AppScout Weekly Intelligence Report`);
lines.push(`### Week ${WEEK} — ${isoDate}`);
lines.push('');
lines.push(`**Coverage:** ${apps.length} apps · ${github.length} GitHub projects · ${leads.length} seller leads · ${signals.length} signals · ${submissions.length} marketplace submissions`);
lines.push(`**AI scored opportunities:** ${Object.keys(ai).length}`);
lines.push('');
lines.push('---');
lines.push('');

// A
lines.push('## A. Hidden app acquisition targets');
lines.push('*Off-market apps with reachable owners. 365+ days stale.*');
lines.push('');
if (acqApps.length === 0) lines.push('_None this week._');
acqApps.forEach((a, i) => {
  lines.push(`### A${i + 1}. ${a.title} (${a.niche})`);
  lines.push(`- **Owner:** ${a.developer} · ${a.ownerType}`);
  lines.push(`- **Installs:** ${a.installs} · **Rating:** ${a.score?.toFixed(2) ?? 'n/a'} · **Stale:** ${a.daysSinceUpdate}d`);
  lines.push(`- **Contact:** ${a.developerEmail}`);
  lines.push(`- **Engine score:** ${a.opportunityScore}/100 · **Classification:** ${a.classification}`);
  const aibl = aiBlock(`app-${a.platform || 'android'}-`, a.appId);
  if (aibl) lines.push(aibl);
  lines.push(`- **URL:** ${a.url}`);
  lines.push('');
});
lines.push('---');
lines.push('');

// B
lines.push('## B. Rebuild opportunities');
lines.push('*Proven demand, broken execution. 180-364 days stale.*');
lines.push('');
if (rebuildApps.length === 0) lines.push('_None this week._');
rebuildApps.forEach((a, i) => {
  lines.push(`### B${i + 1}. ${a.title} (${a.niche})`);
  lines.push(`- **Installs:** ${a.installs} · **Rating:** ${a.score?.toFixed(2)} · **Stale:** ${a.daysSinceUpdate}d`);
  lines.push(`- **Main complaints:** ${a.mainComplaints?.join(', ') || '—'}`);
  const aibl = aiBlock(`app-${a.platform || 'android'}-`, a.appId);
  if (aibl) lines.push(aibl);
  lines.push(`- **URL:** ${a.url}`);
  lines.push('');
});
lines.push('---');
lines.push('');

// C
lines.push('## C. GitHub unfinished projects');
lines.push('*Stars + traction, stale repos. Codebase ready to fork or take over.*');
lines.push('');
if (ghStale.length === 0) lines.push('_None this week._');
ghStale.forEach((g, i) => {
  lines.push(`### C${i + 1}. ${g.fullName}`);
  lines.push(`- ${g.description || '—'}`);
  lines.push(`- **Stars:** ${g.stars?.toLocaleString() ?? 0} · **Language:** ${g.language} · **Stale:** ${g.daysSincePush}d`);
  const aibl = aiBlock('gh-', g.fullName.replace('/', '-'));
  if (aibl) lines.push(aibl);
  lines.push(`- **URL:** ${g.url}`);
  lines.push('');
});
lines.push('---');
lines.push('');

// D
lines.push('## D. Public seller leads');
lines.push('*Real Reddit posts from people trying to sell their apps.*');
lines.push('');
if (sellerLeads.length === 0) lines.push('_None this week._');
sellerLeads.forEach((l, i) => {
  lines.push(`### D${i + 1}. ${l.appName || l.title}`);
  lines.push(`- **Author:** ${l.author} · **Subreddit:** ${l.subreddit}`);
  lines.push(`- **Asking:** ${l.askingPrice || '—'} · **Posted:** ${l.daysAgo}d ago`);
  lines.push(`- **Notes:** ${l.notes || '—'}`);
  const aibl = aiBlock('seller-', l.id);
  if (aibl) lines.push(aibl);
  lines.push(`- **URL:** ${l.url}`);
  lines.push('');
});
lines.push('---');
lines.push('');

// E
lines.push('## E. Startup / news / trend signals');
lines.push('*HN, PH, Indie Hackers — sentiment that converts into deals.*');
lines.push('');
if (signalSet.length === 0) lines.push('_None this week._');
signalSet.forEach((s, i) => {
  lines.push(`### E${i + 1}. ${s.title}`);
  lines.push(`- **Source:** ${s.source} · **Points:** ${s.points} · **${s.daysAgo}d ago**`);
  lines.push(`- ${s.summary}`);
  lines.push(`- **URL:** ${s.url}`);
  lines.push('');
});
lines.push('---');
lines.push('');

// F
lines.push('## F. Project marketplace submissions');
lines.push('*User-uploaded projects looking for buyers, partners, builders, investors, or feedback.*');
lines.push('');
if (subs.length === 0) lines.push('_No submissions this week — be the first at https://appscout-ai.vercel.app/submit_');
subs.forEach((s, i) => {
  lines.push(`### F${i + 1}. ${s.projectName} (${s.stage})`);
  lines.push(`- **Asking:** ${s.asking}${s.price ? ` · ${s.price}` : ''} · **Platform:** ${s.platform}`);
  lines.push(`- ${s.description.slice(0, 240)}${s.description.length > 240 ? '…' : ''}`);
  if (s.url) lines.push(`- **URL:** ${s.url}`);
  if (s.github) lines.push(`- **GitHub:** ${s.github}`);
  lines.push(`- _Contact via AppScout — yearly members get direct intro._`);
  lines.push('');
});
lines.push('---');
lines.push('');

// G
lines.push('## G. AI predictions — top money potential');
lines.push('*Every signal scored on 8 axes by Claude. Highest opportunity scores below.*');
lines.push('');
if (aiRanked.length === 0) lines.push('_AI predictions not yet generated. Run: `node scripts/generate-ai-predictions.js`._');
aiRanked.forEach((a, i) => {
  lines.push(`### G${i + 1}. \`${a.id}\` — score ${a.opportunityScore} · action: ${a.recommendedAction}`);
  lines.push(`- Demand ${a.demandScore} · Money ${a.moneyPotential} · Build-diff ${a.buildDifficulty} · Acq-diff ${a.acquisitionDifficulty} · Legal ${a.legalRisk} · Competition ${a.competitionRisk}`);
  lines.push(`- **Why now:** ${a.whyNow}`);
  lines.push(`- **Top monetization angle:** ${a.monetizationIdeas?.[0] || '—'}`);
  lines.push('');
});
lines.push('---');
lines.push('');

lines.push('## Disclaimer');
lines.push('AppScout provides market research and outreach drafts, not financial or legal advice. Always verify revenue and ownership claims independently. Reddit ingestion paused until commercial API approval.');
lines.push('');
lines.push(`_Generated by AppScout Engine v2 — ${isoDate}_`);

const md = lines.join('\n');

fs.mkdirSync(REPORTS_DIR, { recursive: true });
const fileName = `week-${WEEK}-report.md`;
fs.writeFileSync(path.join(REPORTS_DIR, fileName), md);
fs.writeFileSync(path.join(REPORTS_DIR, 'latest-report.md'), md);

console.log(`\n✓ Saved: web/private/reports/${fileName}`);
console.log(`✓ Saved: web/private/reports/latest-report.md`);
console.log(`\nSection sizes:`);
console.log(`  A. Acquisition targets: ${acqApps.length}`);
console.log(`  B. Rebuild opportunities: ${rebuildApps.length}`);
console.log(`  C. GitHub projects: ${ghStale.length}`);
console.log(`  D. Seller leads: ${sellerLeads.length}`);
console.log(`  E. Signals: ${signalSet.length}`);
console.log(`  F. Marketplace submissions: ${subs.length}`);
console.log(`  G. AI predictions: ${aiRanked.length}`);
