import fs from 'fs';

// ── Load latest scored data ───────────────────────────────────────────────────

const allApps = JSON.parse(fs.readFileSync('data/processed/scored-apps.json', 'utf-8'));
const externalSignals = JSON.parse(fs.readFileSync('data/processed/external-signals.json', 'utf-8'));

// ── Filters ───────────────────────────────────────────────────────────────────

const SKIP_CLASSIFICATIONS = [
  'False positive', 'Active — skip', 'Too small', 'Ignore', 'Needs research',
];

function isGenuineCandidate(app) {
  if (app.disqualified) return false;
  if (SKIP_CLASSIFICATIONS.some(s => (app.classification || '').includes(s))) return false;
  if ((app.minInstalls || 0) < 50_000) return false;
  return true;
}

// ── Risk scorer ───────────────────────────────────────────────────────────────

function riskScore(app) {
  let risk = 0;
  const flags = [];

  if (app.ownerType === 'Portfolio/acquirer') { risk += 30; flags.push('already portfolio-owned'); }
  if (app.ownerType === 'Unknown') { risk += 20; flags.push('owner unidentifiable'); }
  if (!app.developerEmail) { risk += 25; flags.push('no contact found'); }
  if (app.niche === 'Ringtone') { risk += 15; flags.push('copyright/licensing risk in niche'); }
  if ((app.score || 5) < 3.0) { risk += 15; flags.push('very poor rating — may be abandoned by users too'); }
  if (app.daysSinceUpdate < 180) { risk += 20; flags.push('updated recently — not truly abandoned'); }
  if ((app.minInstalls || 0) < 100_000) { risk += 10; flags.push('low install base'); }

  let label;
  if (risk >= 50) label = 'High';
  else if (risk >= 25) label = 'Medium';
  else label = 'Low';

  return { score: risk, label, flags };
}

// ── Why interesting ───────────────────────────────────────────────────────────

function whyInteresting(app) {
  const parts = [];

  if (app.daysSinceUpdate >= 730)
    parts.push(`${Math.round(app.daysSinceUpdate / 365 * 10) / 10} years without an update — developer likely moved on`);
  else if (app.daysSinceUpdate >= 365)
    parts.push(`Over a year without an update — shows developer inactivity`);

  if ((app.minInstalls || 0) >= 1_000_000)
    parts.push(`${app.installs} installs proves strong organic demand`);
  else if ((app.minInstalls || 0) >= 100_000)
    parts.push(`${app.installs} installs — proven niche demand`);

  if (app.ownerType === 'Solo indie')
    parts.push(`Solo indie developer — single point of contact, motivated seller`);
  else if (app.ownerType === 'Small studio')
    parts.push(`Small studio — likely open to exit conversation`);

  if (app.mainComplaints?.length > 0)
    parts.push(`Users complain about: ${app.mainComplaints.join(', ')} — fixable by new owner`);

  if (app.reviewAnalysis) {
    const { lowScorePct, recentActivity } = app.reviewAnalysis;
    if (lowScorePct >= 30)
      parts.push(`${lowScorePct}% of recent reviews are 1-2 stars — product is underserving its audience`);
    if (recentActivity >= 5)
      parts.push(`${recentActivity} reviews in last 90 days — users are still active and engaged`);
  }

  return parts;
}

// ── Recommendation ────────────────────────────────────────────────────────────

function recommendation(app, risk) {
  if (app.classification?.includes('Strong acquisition')) {
    if (risk.label === 'Low') return 'Acquire — contact owner now';
    return 'Acquire — verify details first';
  }
  if (app.classification?.includes('acquisition')) {
    if (risk.label === 'Low') return 'Possible acquisition — send inquiry';
    if (risk.label === 'Medium') return 'Investigate — gather more data before contacting';
    return 'Risky — investigate before contacting';
  }
  if (app.classification?.includes('rebuild')) {
    return 'Rebuild — build a better version targeting the same users';
  }
  return 'Hold — needs more research';
}

function nextAction(app, risk) {
  if (app.strategy === 'Contact developer') {
    if (risk.label === 'Low') return `Draft and send acquisition inquiry to ${app.developerEmail}`;
    return `Research owner background before contacting ${app.developerEmail || 'owner'}`;
  }
  if (app.strategy === 'Build better version') {
    return 'Analyze top complaint themes, validate rebuilding cost, test market with landing page first';
  }
  return 'Monitor — check again in 60 days';
}

// ── Build full opportunity objects ────────────────────────────────────────────

const candidates = allApps.filter(isGenuineCandidate);

const opportunities = candidates.map(app => {
  const risk = riskScore(app);
  return {
    name: app.title,
    appId: app.appId,
    url: app.url,
    niche: app.niche,
    platform: 'Google Play (Android)',
    installs: app.installs,
    minInstalls: app.minInstalls,
    rating: app.score,
    ratingsCount: app.ratings,
    reviewsCount: app.reviews,
    lastUpdated: app.updatedDate,
    daysSinceUpdate: app.daysSinceUpdate,
    released: app.released,
    ownerType: app.ownerType,
    developer: app.developer,
    developerEmail: app.developerEmail,
    free: app.free,
    offersIAP: app.offersIAP,
    adSupported: app.adSupported,
    mainComplaints: app.mainComplaints || [],
    reviewSentiment: app.reviewAnalysis?.sentiment || null,
    lowScorePct: app.reviewAnalysis?.lowScorePct ?? null,
    recentReviewActivity: app.reviewAnalysis?.recentActivity ?? null,
    classification: app.classification,
    strategy: app.strategy,
    opportunityScore: app.opportunityScore,
    riskScore: risk.score,
    riskLabel: risk.label,
    riskFlags: risk.flags,
    whyInteresting: whyInteresting(app),
    recommendation: recommendation(app, risk),
    nextAction: nextAction(app, risk),
  };
}).sort((a, b) => b.opportunityScore - a.opportunityScore);

const acquisitionTargets = opportunities.filter(o => o.strategy === 'Contact developer');
const rebuildTargets = opportunities.filter(o => o.strategy === 'Build better version');
const highRisk = opportunities.filter(o => o.riskLabel === 'High');

// ── Markdown report ───────────────────────────────────────────────────────────

function appBlock(o, rank) {
  const lines = [];
  lines.push(`## ${rank}. ${o.name}`);
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| **Classification** | ${o.classification} |`);
  lines.push(`| **Recommendation** | ${o.recommendation} |`);
  lines.push(`| **Opportunity Score** | ${o.opportunityScore}/100 |`);
  lines.push(`| **Risk** | ${o.riskLabel} |`);
  lines.push(`| **Niche** | ${o.niche} |`);
  lines.push(`| **Installs** | ${o.installs} |`);
  lines.push(`| **Rating** | ${o.rating?.toFixed(2) ?? 'N/A'} (${o.ratingsCount?.toLocaleString() || '?'} ratings) |`);
  lines.push(`| **Last Updated** | ${o.lastUpdated} (${o.daysSinceUpdate} days ago) |`);
  lines.push(`| **Released** | ${o.released || '?'} |`);
  lines.push(`| **Owner Type** | ${o.ownerType} |`);
  lines.push(`| **Developer** | ${o.developer} |`);
  lines.push(`| **Contact** | ${o.developerEmail || '— not found'} |`);
  lines.push(`| **Monetization** | ${[o.offersIAP && 'IAP', o.adSupported && 'Ads', o.free && 'Free'].filter(Boolean).join(', ') || 'Unknown'} |`);
  if (o.reviewSentiment) {
    lines.push(`| **Review Sentiment** | ${o.reviewSentiment} (${o.lowScorePct}% low-score) |`);
  }
  lines.push(`| **Play Store URL** | [Open](${o.url}) |`);
  lines.push('');

  if (o.whyInteresting.length > 0) {
    lines.push('**Why this is interesting:**');
    o.whyInteresting.forEach(w => lines.push(`- ${w}`));
    lines.push('');
  }

  if (o.mainComplaints.length > 0) {
    lines.push(`**User complaints:** ${o.mainComplaints.join(', ')}`);
    lines.push('');
  }

  if (o.riskFlags.length > 0) {
    lines.push('**Risk flags:**');
    o.riskFlags.forEach(f => lines.push(`- ⚠️ ${f}`));
    lines.push('');
  }

  lines.push(`**Next action:** ${o.nextAction}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

const now = new Date().toISOString().split('T')[0];

const md = [
  '# AppScout — Top Opportunities Report',
  `**Generated:** ${now}`,
  `**Total candidates analyzed:** ${opportunities.length}`,
  `**Acquisition targets:** ${acquisitionTargets.length} | **Rebuild targets:** ${rebuildTargets.length}`,
  '',
  '---',
  '',
  '# ACQUISITION TARGETS',
  '*Apps that are old, have real users, and have a reachable indie/small-studio owner.*',
  '',
  ...acquisitionTargets.slice(0, 10).map((o, i) => appBlock(o, i + 1)),
  '',
  '# REBUILD OPPORTUNITIES',
  '*Apps with proven demand but broken products — better to build fresh than acquire.*',
  '',
  ...rebuildTargets.slice(0, 5).map((o, i) => appBlock(o, i + 1)),
  '',
  '# HIGHEST RISK — DO NOT CONTACT YET',
  '',
  ...highRisk.slice(0, 5).map(o =>
    `- **${o.name}** — ${o.riskLabel} risk: ${o.riskFlags.join(', ')}`
  ),
  '',
  '---',
  '',
  `*Report generated by AppScout Research Engine — ${now}*`,
].join('\n');

fs.mkdirSync('data/reports', { recursive: true });
fs.writeFileSync('data/reports/top-opportunities.md', md);
fs.writeFileSync('data/reports/top-opportunities.json', JSON.stringify(opportunities, null, 2));

// ── Console summary ───────────────────────────────────────────────────────────

console.log('\n════════════════════════════════════════════════');
console.log('  TOP 5 ACQUISITION TARGETS');
console.log('════════════════════════════════════════════════\n');
acquisitionTargets.slice(0, 5).forEach((o, i) => {
  console.log(`${i + 1}. ${o.name}`);
  console.log(`   Score: ${o.opportunityScore} | Risk: ${o.riskLabel} | ${o.installs}`);
  console.log(`   Owner: ${o.ownerType} | Email: ${o.developerEmail || '—'}`);
  console.log(`   ${o.daysSinceUpdate} days silent | Rating: ${o.rating?.toFixed(2) ?? 'N/A'}`);
  console.log(`   → ${o.recommendation}`);
  console.log();
});

console.log('════════════════════════════════════════════════');
console.log('  TOP 5 REBUILD OPPORTUNITIES');
console.log('════════════════════════════════════════════════\n');
rebuildTargets.slice(0, 5).forEach((o, i) => {
  console.log(`${i + 1}. ${o.name}`);
  console.log(`   Score: ${o.opportunityScore} | ${o.installs} | Rating: ${o.rating?.toFixed(2) ?? 'N/A'}`);
  console.log(`   Complaints: ${o.mainComplaints.join(', ') || '—'}`);
  console.log(`   → ${o.recommendation}`);
  console.log();
});

console.log('════════════════════════════════════════════════');
console.log('  HIGHEST RISK — HOLD FOR NOW');
console.log('════════════════════════════════════════════════\n');
highRisk.slice(0, 5).forEach((o, i) => {
  console.log(`${i + 1}. ${o.name} [${o.riskLabel} risk]`);
  console.log(`   Flags: ${o.riskFlags.join(' | ')}`);
  console.log();
});

console.log('════════════════════════════════════════════════');
console.log('  FIRST APP TO CONTACT MANUALLY');
console.log('════════════════════════════════════════════════\n');
const best = acquisitionTargets.find(o => o.riskLabel === 'Low' || o.riskLabel === 'Medium');
if (best) {
  console.log(`→ ${best.name}`);
  console.log(`  Email: ${best.developerEmail}`);
  console.log(`  Why: ${best.whyInteresting[0] || best.recommendation}`);
  console.log(`  Risk: ${best.riskLabel} — ${best.riskFlags.join(', ') || 'no major flags'}`);
}

console.log('\n✓ Saved: data/reports/top-opportunities.md');
console.log('✓ Saved: data/reports/top-opportunities.json\n');
