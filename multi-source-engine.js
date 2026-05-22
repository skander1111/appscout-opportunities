/**
 * AppScout Multi-Source Engine
 *
 * Sources:
 *   1. Google Play  — published abandoned Android apps
 *   2. App Store    — published abandoned iOS apps
 *   3. GitHub       — unfinished/abandoned mobile code projects
 *   4. Reddit       — demand signals + builder abandonment posts
 *   5. Hacker News  — Show HN apps that got traction then went quiet
 *   6. IndieHackers — launched products with stale activity
 *
 * Classifications:
 *   A. Published app acquisition target  (Google Play)
 *   B. Published app rebuild opportunity (Google Play)
 *   C. GitHub codebase opportunity       (buyable/forkable code + demand)
 *   D. Niche demand signal               (Reddit/HN: users want but can't find)
 *   E. Abandoned builder / direct seller (Reddit/IH: builder wants out)
 */

import fs from 'fs';
import { findAbandonedRepos, findAbandonedByCategory } from './sources/github.js';
import { findAbandonedIOSApps } from './sources/appStore.js';
import { getDemandSignals, findAbandonedBuilders, findDirectSellers } from './sources/reddit.js';
import { findAbandonedShowHN, scanAbandonedApps } from './sources/hackerNews.js';
import { findAbandonedProducts } from './sources/indieHackers.js';

const OUTPUT_FILE = 'data/reports/multi-source-opportunities.json';
const REPORT_FILE = 'data/reports/multi-source-opportunities.md';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const NICHES = [
  'habit tracker',
  'meditation',
  'timer',
  'barcode scanner',
  'compass',
  'pdf reader',
  'expense tracker',
  'flashcard',
  'quiz',
  'wallpaper',
];

// ─── Runners ─────────────────────────────────────────────────────────────────

async function runGitHubScan() {
  console.log('\n[GitHub] Scanning for abandoned mobile repos...');
  const results = [];

  for (const niche of NICHES.slice(0, 6)) {
    process.stdout.write(`  · ${niche}... `);
    const { repos } = await findAbandonedRepos(niche);
    if (repos.length) {
      results.push(...repos.map(r => ({
        ...r,
        niche,
        source: 'github',
        type: 'C_codebase_opportunity',
        recommendation: r.license !== 'None'
          ? `Open-source codebase with ${r.stars} stars and ${r.daysSincePush} days of neglect. Consider forking or contacting @${r.owner} to acquire/partner.`
          : `${r.stars}-star repo, license unclear. Contact @${r.owner} before using.`,
        nextAction: r.ownerEmail
          ? `Email ${r.ownerEmail} — owner contact found`
          : `Contact via GitHub: https://github.com/${r.owner}`,
      })));
      console.log(`${repos.length} found`);
    } else {
      console.log('none');
    }
    await sleep(2000);
  }

  return results.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 15);
}

async function runRedditScan() {
  console.log('\n[Reddit] Scanning for demand signals and abandoned builders...');

  // Demand signals
  const demandResults = [];
  for (const niche of NICHES.slice(0, 8)) {
    process.stdout.write(`  · ${niche} demand... `);
    const signal = await getDemandSignals(niche);
    if (signal.demandStrength !== 'Low') {
      demandResults.push({
        niche,
        source: 'reddit',
        type: 'D_niche_demand',
        demandStrength: signal.demandStrength,
        postCount: signal.postCount,
        totalEngagement: signal.totalEngagement,
        topPost: signal.topPost,
        opportunityScore: signal.totalEngagement > 1000 ? 70 : signal.totalEngagement > 200 ? 50 : 30,
        recommendation: `Strong Reddit demand for "${niche}" apps. ${signal.postCount} posts, ${signal.totalEngagement} engagement. Good niche to build or acquire in.`,
        nextAction: `Research top app in niche, check if any are stale or poorly maintained.`,
      });
      console.log(`${signal.demandStrength} (${signal.totalEngagement} engagement)`);
    } else {
      console.log('Low');
    }
    await sleep(2000);
  }

  // Direct sellers
  console.log('  · Scanning for direct sellers...');
  const sellers = await findDirectSellers();
  const sellerResults = sellers.map(p => ({
    title: p.title,
    subreddit: p.subreddit,
    url: p.url,
    date: p.date,
    score: p.score,
    source: 'reddit',
    type: 'E_abandoned_builder',
    opportunityScore: p.relevanceScore,
    recommendation: 'Potential direct seller. Someone posted about selling or abandoning an app.',
    nextAction: `Read thread: ${p.url} — contact author ${p.author ? `u/${p.author}` : '(see post)'}`,
  }));

  return { demandResults, sellerResults };
}

async function runHackerNewsScan() {
  console.log('\n[HackerNews] Scanning Show HN posts...');
  const results = await scanAbandonedApps(NICHES.slice(0, 8));

  return results.map(r => ({
    ...r,
    source: 'hackernews',
    type: 'E_abandoned_builder',
    recommendation: `Show HN post with ${r.points} upvotes, posted ${r.daysSincePost} days ago. App likely still has users — builder may have moved on.`,
    nextAction: `Read HN thread: ${r.url}. If app exists, check Play Store. Contact author ${r.author ? `u/${r.author}` : ''} on HN.`,
  }));
}

async function runIOSScan() {
  console.log('\n[App Store] Scanning for abandoned iOS apps...');
  try {
    const apps = await findAbandonedIOSApps();
    console.log(`  Found ${apps.length} iOS opportunities`);
    return apps;
  } catch (err) {
    console.log(`  Failed: ${err.message}`);
    return [];
  }
}

async function runIndieHackersScan() {
  console.log('\n[IndieHackers] Scanning abandoned products...');
  const results = [];

  for (const niche of NICHES.slice(0, 5)) {
    process.stdout.write(`  · ${niche}... `);
    const products = await findAbandonedProducts(niche);
    if (products.length) {
      results.push(...products.map(p => ({
        ...p,
        niche,
        type: 'E_abandoned_builder',
        recommendation: `IH product with ${p.upvotes} upvotes, last active ${p.daysSinceActivity} days ago. Founder may be open to a conversation.`,
        nextAction: p.externalUrl
          ? `Check if app is still live: ${p.externalUrl}. Then contact founder via IH.`
          : `Contact founder via IndieHackers: ${p.url}`,
      })));
      console.log(`${products.length} found`);
    } else {
      console.log('none');
    }
    await sleep(2000);
  }

  return results;
}

// ─── Report generator ─────────────────────────────────────────────────────────

function generateReport(ios, github, redditDemand, redditSellers, hn, ih) {
  const now = new Date().toISOString().split('T')[0];
  const lines = [];

  lines.push(`# AppScout Multi-Source Opportunities`);
  lines.push(`Generated: ${now} · Sources: App Store · Google Play · GitHub · Reddit · Hacker News · IndieHackers`);
  lines.push('');

  // ── iOS App Store ─────────────────────────────────────────────────────────
  lines.push('## Section A2 — iOS App Store Opportunities');
  lines.push('*Abandoned iOS apps with proven user base. Stale 180+ days. Indie developers.*');
  lines.push('');

  if (!ios.length) {
    lines.push('No iOS opportunities found in this scan.');
  } else {
    lines.push('| # | App | Category | Rating | Ratings | Days stale | Score |');
    lines.push('|---|-----|----------|--------|---------|------------|-------|');
    ios.slice(0, 10).forEach((a, i) => {
      lines.push(`| ${i+1} | [${a.name}](${a.appStoreUrl}) | ${a.category} | ★${a.rating} | ${a.ratingCount?.toLocaleString()} | ${a.staleDays} | ${a.score} |`);
    });
    lines.push('');

    ios.slice(0, 5).forEach((a, i) => {
      lines.push(`### iOS #${i+1} — ${a.name}`);
      lines.push(`**Score: ${a.score} · ★${a.rating} · ${a.ratingCount?.toLocaleString()} ratings · ${a.staleDays} days stale**`);
      lines.push('');
      lines.push('| | |');
      lines.push('|---|---|');
      lines.push(`| Category | ${a.category} |`);
      lines.push(`| Developer | ${a.developer} |`);
      lines.push(`| Price | ${a.price === 0 ? 'Free' : `$${a.price}`} |`);
      lines.push(`| Last update | ${a.lastUpdate?.split('T')[0] ?? '—'} (${a.staleDays} days ago) |`);
      lines.push(`| Contact | ${a.contactUrl ? `[Developer site](${a.contactUrl})` : 'No public contact — search developer name'} |`);
      lines.push(`| App Store | [View](${a.appStoreUrl}) |`);
      lines.push('');
      lines.push(`**Note:** iOS doesn't expose developer emails publicly. Find contact via the developer website above or by searching the developer name on LinkedIn.`);
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  // ── GitHub ────────────────────────────────────────────────────────────────
  lines.push('## Section C — GitHub Codebase Opportunities');
  lines.push('*Abandoned mobile repos with proven demand. Fork, buy, or partner with creator.*');
  lines.push('');

  if (!github.length) {
    lines.push('No high-signal GitHub repos found in this scan.');
  } else {
    lines.push(`| # | Repo | Stars | Language | Days stale | License | Score |`);
    lines.push(`|---|------|-------|----------|------------|---------|-------|`);
    github.slice(0, 10).forEach((r, i) => {
      lines.push(`| ${i+1} | [${r.title}](${r.url}) | ${r.stars} | ${r.language || '—'} | ${r.daysSincePush} | ${r.license} | ${r.opportunityScore} |`);
    });
    lines.push('');

    github.slice(0, 5).forEach((r, i) => {
      lines.push(`### GitHub #${i+1} — ${r.title}`);
      lines.push(`**Score: ${r.opportunityScore} · ${r.stars} stars · ${r.daysSincePush} days stale · License: ${r.license}**`);
      lines.push('');
      lines.push(`| | |`);
      lines.push(`|---|---|`);
      lines.push(`| Niche | ${r.niche} |`);
      lines.push(`| Language | ${r.language || 'Unknown'} |`);
      lines.push(`| Stars | ${r.stars} |`);
      lines.push(`| Forks | ${r.forks} |`);
      lines.push(`| Open issues | ${r.openIssues} |`);
      lines.push(`| Last push | ${r.lastPush} |`);
      lines.push(`| License | ${r.license} |`);
      lines.push(`| Owner | [@${r.owner}](https://github.com/${r.owner}) |`);
      if (r.ownerEmail) lines.push(`| Contact | ${r.ownerEmail} |`);
      lines.push(`| GitHub | ${r.url} |`);
      if (r.description) lines.push(`| Description | ${r.description} |`);
      lines.push('');
      lines.push(`**Recommendation:** ${r.recommendation}`);
      lines.push(`**Next action:** ${r.nextAction}`);
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  // ── Reddit demand ─────────────────────────────────────────────────────────
  lines.push('## Section D — Niche Demand Signals (Reddit)');
  lines.push('*Where users are loudly asking for better apps. Build or acquire into these niches.*');
  lines.push('');

  if (!redditDemand.length) {
    lines.push('No high-demand niches detected in this scan.');
  } else {
    lines.push('| Niche | Demand | Posts | Engagement | Top post |');
    lines.push('|-------|--------|-------|------------|----------|');
    redditDemand.forEach(r => {
      const post = r.topPost ? `[link](${r.topPost.url})` : '—';
      lines.push(`| ${r.niche} | **${r.demandStrength}** | ${r.postCount} | ${r.totalEngagement} | ${post} |`);
    });
    lines.push('');
    lines.push('High demand = validated niche. If the top Google Play apps in this niche are stale or poorly rated, there is a clear acquisition or rebuild opportunity.');
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Direct sellers ────────────────────────────────────────────────────────
  lines.push('## Section E — Abandoned Builders / Direct Sellers');
  lines.push('*People who built something and may want out. Best leads to contact directly.*');
  lines.push('');

  const allSellers = [
    ...redditSellers.map(r => ({ ...r, platform: 'Reddit' })),
    ...hn.map(r => ({ ...r, platform: 'Hacker News', title: r.title, score: r.points })),
    ...ih.map(r => ({ ...r, platform: 'IndieHackers', title: r.name, score: r.upvotes })),
  ].sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));

  if (!allSellers.length) {
    lines.push('No direct seller signals found in this scan. Try running `findDirectSellers()` separately.');
  } else {
    allSellers.slice(0, 10).forEach((s, i) => {
      lines.push(`### Seller Signal #${i+1} — ${s.platform}`);
      lines.push(`**"${(s.title || '').substring(0, 80)}"**`);
      lines.push('');
      if (s.url) lines.push(`Link: ${s.url}`);
      if (s.date || s.postedDate) lines.push(`Posted: ${s.date || s.postedDate}`);
      if (s.score) lines.push(`Engagement: ${s.score} upvotes/points`);
      lines.push('');
      lines.push(`**Next action:** ${s.nextAction}`);
      lines.push('');
    });
  }

  lines.push('---');
  lines.push('');
  lines.push('## How to act on these signals');
  lines.push('');
  lines.push('| Type | Action |');
  lines.push('|------|--------|');
  lines.push('| GitHub repo (open license) | Fork immediately · Contact owner about buyout/partnership |');
  lines.push('| GitHub repo (no license) | Contact owner first — ownership unclear |');
  lines.push('| High Reddit demand niche | Cross-reference with Google Play stale apps in that niche |');
  lines.push('| Reddit/HN direct seller | Read thread · Comment or DM · Move fast |');
  lines.push('| IndieHackers product | Check if app is still live · Contact founder via IH |');
  lines.push('');
  lines.push('*Data from public APIs only. No private data accessed.*');

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('=== AppScout Multi-Source Engine ===');
  console.log(`Niches: ${NICHES.slice(0, 8).join(', ')}...\n`);

  const [github, ios, redditData, hn, ih] = await Promise.allSettled([
    runGitHubScan(),
    runIOSScan(),
    runRedditScan(),
    runHackerNewsScan(),
    runIndieHackersScan(),
  ]);

  const githubResults   = github.status === 'fulfilled' ? github.value : [];
  const iosResults      = ios.status === 'fulfilled' ? ios.value : [];
  const redditDemand    = redditData.status === 'fulfilled' ? redditData.value.demandResults : [];
  const redditSellers   = redditData.status === 'fulfilled' ? redditData.value.sellerResults : [];
  const hnResults       = hn.status === 'fulfilled' ? hn.value : [];
  const ihResults       = ih.status === 'fulfilled' ? ih.value : [];

  // Save raw JSON
  const output = {
    generatedAt: new Date().toISOString(),
    ios: iosResults,
    github: githubResults,
    redditDemand,
    redditSellers,
    hackerNews: hnResults,
    indieHackers: ihResults,
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  // Generate markdown report
  const report = generateReport(iosResults, githubResults, redditDemand, redditSellers, hnResults, ihResults);
  fs.writeFileSync(REPORT_FILE, report);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`iOS App Store:         ${iosResults.length}`);
  console.log(`GitHub repos:          ${githubResults.length}`);
  console.log(`Reddit demand niches:  ${redditDemand.length}`);
  console.log(`Reddit seller signals: ${redditSellers.length}`);
  console.log(`HN Show signals:       ${hnResults.length}`);
  console.log(`IndieHackers products: ${ihResults.length}`);
  console.log(`\nReport: ${REPORT_FILE}`);
  console.log(`JSON:   ${OUTPUT_FILE}`);
}

run().catch(err => {
  console.error('Multi-source engine failed:', err.message);
  process.exit(1);
});
