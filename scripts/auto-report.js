/**
 * auto-report.js
 * Reads data/processed/scored-apps.json, builds a clean markdown report,
 * saves to web/private/reports/latest-report.md and data/reports/week-N-report.md
 * Run after research-engine.js completes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── Load data ───────────────────────────────────────────────────────────────

const scoredPath = path.join(ROOT, 'data', 'processed', 'scored-apps.json');
if (!fs.existsSync(scoredPath)) {
  console.error('scored-apps.json not found — run research-engine.js first');
  process.exit(1);
}

const apps = JSON.parse(fs.readFileSync(scoredPath, 'utf8'));
const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const weekNum = getWeekNumber();

// ─── Classify ────────────────────────────────────────────────────────────────

const acquisitionTargets = apps
  .filter(a => !a.disqualified && a.daysSinceUpdate >= 365)
  .sort((a, b) => b.opportunityScore - a.opportunityScore)
  .slice(0, 5);

const rebuildOpportunities = apps
  .filter(a => !a.disqualified && a.daysSinceUpdate >= 180 && a.daysSinceUpdate < 365)
  .sort((a, b) => b.opportunityScore - a.opportunityScore)
  .slice(0, 5);

const watchList = apps
  .filter(a => !a.disqualified && a.daysSinceUpdate >= 120 && a.daysSinceUpdate < 180)
  .sort((a, b) => b.opportunityScore - a.opportunityScore)
  .slice(0, 6);

const doNotContact = apps
  .filter(a => a.disqualified)
  .slice(0, 5);

// ─── Niche rankings ──────────────────────────────────────────────────────────

const nicheMap = {};
for (const app of apps.filter(a => !a.disqualified)) {
  const n = app.niche || 'Other';
  if (!nicheMap[n]) nicheMap[n] = { apps: [], scores: [] };
  nicheMap[n].apps.push(app);
  nicheMap[n].scores.push(app.opportunityScore);
}

const nicheRankings = Object.entries(nicheMap)
  .map(([niche, { apps: nicheApps, scores }]) => ({
    niche,
    count: nicheApps.length,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    acquisitionCount: nicheApps.filter(a => a.daysSinceUpdate >= 365).length,
  }))
  .filter(n => n.count >= 2)
  .sort((a, b) => b.avgScore - a.avgScore)
  .slice(0, 8);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stars(score) {
  return `★ ${Number(score).toFixed(2)}`;
}

function riskLevel(app) {
  if (app.ownerType?.toLowerCase().includes('solo')) return 'Low';
  if (app.opportunityScore >= 80) return 'Low';
  if (app.opportunityScore >= 65) return 'Medium';
  return 'Medium';
}

function contactWhen(daysSinceUpdate) {
  const daysLeft = 365 - daysSinceUpdate;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + Math.max(0, daysLeft) + 14);
  return targetDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function outreachEmail(app) {
  const firstName = app.developer?.split(/[\s,]/)[0] || '';
  const isPersonName = /^[A-Z][a-z]+$/.test(firstName);
  const greeting = isPersonName ? `Hi ${firstName},` : 'Hi,';
  const installs = app.installs || `${(app.minInstalls || 0).toLocaleString()}+`;
  return `\`\`\`
Subject: Question about ${app.title}

${greeting}

I came across your ${app.title} on ${app.platform === 'ios' ? 'the App Store' : 'Google Play'} and wanted to reach out directly.

I noticed it has ${installs} installs and looks like updates have slowed
down — I wasn't sure if you're still actively working on it.

I'm exploring whether you might be open to a conversation about the app's
future — whether that's acquisition, a partnership, or something else entirely.

No pressure at all.

Best,
Skander Aloui
\`\`\``;
}

function complaints(app) {
  const c = app.mainComplaints || app.reviewAnalysis?.complaints || [];
  return c.length ? c.join(', ') : 'none flagged';
}

function platformLabel(app) {
  return app.platform === 'ios' ? 'App Store' : 'Play Store';
}

function appIdRow(app) {
  if (app.platform === 'ios') {
    return app.appId ? `| App Store ID | ${app.appId} |` : '';
  }
  return app.appId ? `| Play Store | ${app.appId} |` : '';
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

function contactRow(app) {
  if (app.developerEmail) return `| Contact | ${app.developerEmail} |`;
  if (app.emailGuesses?.length) return `| Contact (guessed) | ${app.emailGuesses[0]} |`;
  return `| Contact | Via ${platformLabel(app)} developer page |`;
}

// ─── Report builder ──────────────────────────────────────────────────────────

function buildReport() {
  const totalScanned = apps.length;
  const nichesScanned = new Set(apps.map(a => a.niche)).size;

  let md = `# AppScout — Week ${weekNum} Report
**Top iOS & Android App Acquisition Opportunities**
Generated: ${today} · Engine v2.2 · ${nichesScanned} niches scanned · ${totalScanned} apps scored · Human-reviewed

---

> **How to read this report**
> Scores are capped at 100. Acquisition targets = 365+ days stale + reachable indie owner.
> Rebuild opportunities = 180–364 days stale, active user base, fixable problems.
> Watch list = 120–179 days stale — monitor now, contact in 4–8 weeks.
> Move fast. None of these are listed on Flippa or Acquire.com.

---

## Section 1 — Acquisition Targets
*Apps stale 365+ days. Indie or small studio owner. Direct contact available.*

---

`;

  acquisitionTargets.forEach((app, i) => {
    const action = app.opportunityScore >= 85
      ? 'Contact developer now'
      : app.opportunityScore >= 70
        ? 'Contact — verify owner type first'
        : 'Contact with caution';

    md += `### #${i + 1} — ${app.title}
**Score: ${app.opportunityScore} · Risk: ${riskLevel(app)} · Action: ${action}**

| | |
|---|---|
| Niche | ${app.niche || 'Utility'} |
| Installs | ${app.installs || (app.minInstalls || 0).toLocaleString() + '+'} |
| Rating | ${stars(app.score)} |
| Last update | **${app.daysSinceUpdate} days ago** |
| Owner type | ${app.ownerType || 'Unknown'} |
| Developer | ${app.developer} |
${contactRow(app)}
${appIdRow(app)}

**Why it's interesting**
- ${app.daysSinceUpdate} days without an update — strong abandonment signal
- ${app.installs || (app.minInstalls || 0).toLocaleString() + '+'} installs in the ${app.niche || 'utility'} niche
- ${stars(app.score)} rating — users are satisfied, retention is intact
- Main complaints from reviews: ${complaints(app)}

**Outreach email**
${outreachEmail(app)}

---

`;
  });

  md += `## Section 2 — Rebuild Opportunities
*Apps 180–364 days stale. Active user base. Fixable problems. Consider buying and improving.*

---

`;

  rebuildOpportunities.forEach((app, i) => {
    const daysToThreshold = Math.max(0, 365 - app.daysSinceUpdate);
    const followUpNote = daysToThreshold <= 30
      ? `**Approaching acquisition threshold in ${daysToThreshold} days.**`
      : `${daysToThreshold} days from acquisition threshold.`;

    md += `### #${i + 6} — ${app.title}${i === 0 ? ' ⭐ Top pick this week' : ''}
**Score: ${app.opportunityScore} · ${app.daysSinceUpdate} days stale · Action: Monitor**

| | |
|---|---|
| Niche | ${app.niche || 'Utility'} |
| Installs | ${app.installs || (app.minInstalls || 0).toLocaleString() + '+'} |
| Rating | ${stars(app.score)} |
| Owner type | ${app.ownerType || 'Unknown'} |
${contactRow(app)}

**Signal:** ${followUpNote} Main complaints: ${complaints(app)}. ${
  app.mainComplaints?.includes('ads') || app.mainComplaints?.includes('bugs')
    ? 'Fixable issues — ads and bugs are recoverable with one good update.'
    : 'Monitor for continued staleness.'
}

**Flag for follow-up:** Set a reminder for ${contactWhen(app.daysSinceUpdate)}.

---

`;
  });

  md += `## Section 3 — Watch List
*120–179 days stale. Flag now. Contact in 6–10 weeks if still no update.*

| App | Installs | Rating | Days stale | Niche | When to contact |
|-----|----------|--------|------------|-------|-----------------|
`;

  for (const app of watchList) {
    md += `| ${app.title} | ${app.installs || (app.minInstalls || 0).toLocaleString() + '+'} | ${stars(app.score)} | ${app.daysSinceUpdate} | ${app.niche || 'Utility'} | ${contactWhen(app.daysSinceUpdate)} |\n`;
  }

  md += `
---

## Section 4 — Risky / Do Not Contact

| App | Risk | Reason |
|-----|------|--------|
`;

  for (const app of doNotContact) {
    md += `| ${app.title} | ⛔ High | ${app.disqualifyReason || 'Large company or active studio'} |\n`;
  }

  md += `
---

## Niche Rankings (this week)

Top niches by opportunity density:

| Niche | Valid apps | Avg score | Acquisition targets |
|-------|-----------|-----------|---------------------|
`;

  for (const n of nicheRankings) {
    md += `| ${n.niche} | ${n.count} | ${n.avgScore} | ${n.acquisitionCount} |\n`;
  }

  md += `
---

## Master Checklist (per lead)

**Before emailing:**
- [ ] App installs and works on current Android/iOS version
- [ ] Developer email is personal (Gmail) or verifiable company domain
- [ ] Owner is not a portfolio aggregator (check number of apps, email pattern)
- [ ] No trademark or brand conflict risk
- [ ] Not already listed on Flippa, Acquire.com, or MicroAcquire

**In the email:**
- [ ] Use first name if developer appears to be a person
- [ ] Keep it under 120 words
- [ ] No price discussion in first email
- [ ] Close with "no pressure"

**After reply:**
- [ ] Log outcome in your tracking sheet
- [ ] Send follow-up after 6–7 days if no reply
- [ ] If interested: ask for MAU, revenue, and reason for selling before making any offer

---

*All data from App Store and Google Play public listings · Scores capped at 100 · Human-reviewed · Not financial advice*
*Report contains private developer contact information — do not share publicly*
`;

  return md;
}

// ─── Write outputs ────────────────────────────────────────────────────────────

const report = buildReport();

// Latest (always overwritten — this is what the website serves)
const latestPath = path.join(ROOT, 'web', 'private', 'reports', 'latest-report.md');
fs.mkdirSync(path.dirname(latestPath), { recursive: true });
fs.writeFileSync(latestPath, report);

// Versioned archive
const archiveName = `week-${weekNum}-report.md`;
const archivePath = path.join(ROOT, 'data', 'reports', archiveName);
fs.mkdirSync(path.dirname(archivePath), { recursive: true });
fs.writeFileSync(archivePath, report);

console.log(`✓ Report generated: web/private/reports/latest-report.md`);
console.log(`✓ Archive saved:    data/reports/${archiveName}`);
console.log(`  ${acquisitionTargets.length} acquisition targets · ${rebuildOpportunities.length} rebuild opportunities · ${watchList.length} on watch list`);
