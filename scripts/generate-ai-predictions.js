// Generate Claude AI predictions for every opportunity in the unified feed.
// Writes web/data/ai-predictions.json keyed by opportunity id.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/generate-ai-predictions.js [--limit=N] [--refresh]
//
// Without the API key it falls back to deterministic scores so the UI still
// looks alive in local dev.

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const args = process.argv.slice(2);
const LIMIT = (() => {
  const a = args.find((x) => x.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1]) || 60 : 60;
})();
const REFRESH = args.includes('--refresh');

const ROOT = process.cwd();
const WEB_DATA = path.join(ROOT, 'web', 'data');
const OUT_FILE = path.join(WEB_DATA, 'ai-predictions.json');
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const SKIP_CLASSIFICATIONS = new Set(['Active — skip', 'Ignore', 'Too small', 'False positive']);

function readJson(file, fallback) {
  const full = path.join(WEB_DATA, file);
  if (!fs.existsSync(full)) return fallback;
  try { return JSON.parse(fs.readFileSync(full, 'utf8')); }
  catch { return fallback; }
}

function appToOpp(a) {
  const days = a.daysSinceUpdate ?? 0;
  return {
    id: `app-${a.platform || 'android'}-${a.appId}`,
    source: a.platform === 'ios' ? 'appstore' : 'googleplay',
    kind: days >= 365 ? 'abandoned-app' : 'rebuild-target',
    title: a.title,
    description: a.mainComplaints?.join(', '),
    url: a.url,
    niche: a.niche,
    installs: a.minInstalls,
    daysStale: days,
    rating: a.score,
    owner: a.developer,
    ownerType: a.ownerType,
    contact: a.developerEmail,
    legacyScore: a.opportunityScore,
  };
}

function githubToOpp(g) {
  return {
    id: `gh-${g.fullName.replace('/', '-')}`,
    source: 'github',
    kind: 'github-stale',
    title: g.name,
    description: g.description,
    url: g.url,
    niche: g.topics?.[0],
    stars: g.stars,
    daysStale: g.daysSincePush,
    owner: g.owner,
    ownerType: g.ownerType,
  };
}

function leadToOpp(l) {
  return {
    id: `seller-${l.id}`,
    source: 'reddit',
    kind: 'seller-lead',
    title: l.appName || l.title,
    description: l.notes,
    url: l.url,
    daysStale: l.daysAgo,
    owner: l.author,
    price: l.askingPrice,
  };
}

function signalToOpp(s) {
  return {
    id: `sig-${s.id}`,
    source: s.source,
    kind: 'startup-signal',
    title: s.title,
    description: s.summary,
    url: s.url,
    niche: s.niche,
    daysStale: s.daysAgo,
  };
}

function fallbackPrediction(o) {
  const installs = o.installs ?? 0;
  const stars = o.stars ?? 0;
  const demandScore = Math.min(100, Math.round(
    installs > 0 ? Math.log10(installs + 1) * 14 : stars > 0 ? Math.log10(stars + 1) * 18 : 35,
  ));
  const moneyPotential = o.kind === 'github-stale' ? 55 : 65;
  const acquisitionDifficulty = o.contact ? 30 : 60;
  const buildDifficulty = o.kind === 'github-stale' ? 35 : 55;
  const legalRisk = (o.niche || '').toLowerCase().includes('ringtone') ? 75 : 25;
  const competitionRisk = installs > 1_000_000 ? 70 : 45;
  const opportunityScore = Math.round(
    demandScore * 0.35 + moneyPotential * 0.25 +
    (100 - acquisitionDifficulty) * 0.20 + (100 - legalRisk) * 0.10 +
    (100 - competitionRisk) * 0.10,
  );
  let action = 'watch';
  if (o.kind === 'abandoned-app' && opportunityScore >= 65) action = 'acquire';
  else if (o.kind === 'rebuild-target') action = 'rebuild';
  else if (o.kind === 'seller-lead') action = 'buy';
  else if (o.kind === 'partner-request') action = 'partner';
  else if (o.kind === 'github-stale') action = (o.daysStale ?? 0) >= 365 ? 'acquire' : 'rebuild';

  return {
    opportunityScore, demandScore, moneyPotential, competitionRisk,
    buildDifficulty, acquisitionDifficulty, legalRisk,
    recommendedAction: action,
    whyNow: o.daysStale
      ? `Asset stale for ${o.daysStale} days while still showing usage — typical window before brokers notice.`
      : `Signal is recent and underexploited.`,
    monetizationIdeas: [
      'Freemium with paywall on premium features',
      'Subscription tier + remove ads for paying users',
      'B2B license / white-label',
      'Cross-sell related niche tools',
    ],
    outreachDraft: `Hi ${o.owner || 'there'},\n\nI came across ${o.title} and noticed it hasn't been updated in a while. I'm exploring opportunities in this space and your project caught my attention.\n\nWould you be open to a short conversation about its future?\n\nNo pressure either way.\n\nBest,`,
    dueDiligence: [
      'Verify owner identity via second channel',
      'Pull last 90 days of reviews / issues',
      'Check trademark + privacy policy',
      'Confirm revenue claims with screenshare',
      'Sanity-check installs with public estimator',
      'Confirm asset is not under offer',
    ],
    generatedAt: new Date().toISOString(),
    modelId: 'fallback',
  };
}

const SYSTEM = `You are AppScout's senior deal-intelligence analyst.
You evaluate digital opportunities and score them for a buyer/builder/partner.

For every opportunity return ONE JSON object — no prose, no markdown — matching this exact shape:

{
  "opportunityScore": 0-100,
  "demandScore": 0-100,
  "moneyPotential": 0-100,
  "competitionRisk": 0-100,
  "buildDifficulty": 0-100,
  "acquisitionDifficulty": 0-100,
  "legalRisk": 0-100,
  "recommendedAction": "acquire"|"rebuild"|"partner"|"buy"|"sell"|"invest"|"watch"|"ignore",
  "whyNow": "1-2 sentence rationale",
  "monetizationIdeas": ["3-5 concrete monetization angles"],
  "outreachDraft": "ready-to-send cold message ~120 words, plain text",
  "dueDiligence": ["5-8 concrete checks"]
}

Be terse, specific, operator-minded.`;

async function generate(client, o) {
  if (!client) return fallbackPrediction(o);
  try {
    const userMsg = `Opportunity:
Source: ${o.source}
Kind: ${o.kind}
Title: ${o.title}
Niche: ${o.niche || 'unknown'}
URL: ${o.url || 'n/a'}
Description: ${o.description || 'n/a'}
Installs: ${o.installs ?? 'n/a'}
Stars: ${o.stars ?? 'n/a'}
Days stale: ${o.daysStale ?? 'n/a'}
Rating: ${o.rating ?? 'n/a'}
Owner: ${o.owner || 'unknown'} (${o.ownerType || 'unknown'})
Contact known: ${o.contact ? 'yes' : 'no'}
Asking/price: ${o.price || 'n/a'}
Legacy score: ${o.legacyScore ?? 'n/a'}

Return JSON only.`;

    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no json');
    const parsed = JSON.parse(match[0]);
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    return {
      opportunityScore: clamp(parsed.opportunityScore),
      demandScore: clamp(parsed.demandScore),
      moneyPotential: clamp(parsed.moneyPotential),
      competitionRisk: clamp(parsed.competitionRisk),
      buildDifficulty: clamp(parsed.buildDifficulty),
      acquisitionDifficulty: clamp(parsed.acquisitionDifficulty),
      legalRisk: clamp(parsed.legalRisk),
      recommendedAction: parsed.recommendedAction || 'watch',
      whyNow: String(parsed.whyNow || ''),
      monetizationIdeas: Array.isArray(parsed.monetizationIdeas) ? parsed.monetizationIdeas.slice(0, 6) : [],
      outreachDraft: String(parsed.outreachDraft || ''),
      dueDiligence: Array.isArray(parsed.dueDiligence) ? parsed.dueDiligence.slice(0, 10) : [],
      generatedAt: new Date().toISOString(),
      modelId: res.model || MODEL,
    };
  } catch (err) {
    console.error(`[ai] ${o.id} fell back:`, err.message);
    return { ...fallbackPrediction(o), modelId: `${MODEL}-fallback` };
  }
}

async function main() {
  const client = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

  if (!client) console.log('⚠ No ANTHROPIC_API_KEY — using deterministic fallback.');

  const apps = readJson('opportunities.json', []).filter(a => !a.disqualified && !SKIP_CLASSIFICATIONS.has(a.classification));
  const github = readJson('github-projects.json', []);
  const leads = readJson('seller-leads.json', []);
  const signals = readJson('signals.json', []);

  let opps = [
    ...apps.map(appToOpp),
    ...github.map(githubToOpp),
    ...leads.map(leadToOpp),
    ...signals.map(signalToOpp),
  ];

  opps.sort((a, b) => (b.legacyScore ?? 0) - (a.legacyScore ?? 0));
  opps = opps.slice(0, LIMIT);

  const cache = REFRESH ? {} : readJson('ai-predictions.json', {});
  let generated = 0;
  let skipped = 0;

  for (const o of opps) {
    if (cache[o.id] && !REFRESH) { skipped++; continue; }
    process.stdout.write(`  generating ${o.id}…`);
    cache[o.id] = await generate(client, o);
    generated++;
    process.stdout.write(` ✓ score=${cache[o.id].opportunityScore} ${cache[o.id].recommendedAction}\n`);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(cache, null, 2));
  console.log(`\n✓ ${generated} generated, ${skipped} cached, total ${Object.keys(cache).length}`);
  console.log(`✓ written: ${OUT_FILE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
