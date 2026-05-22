import fs from 'fs';
import path from 'path';
import { searchApps, getAppDetails, getReviewAnalysis, sleep } from './sources/googlePlay.js';
import { getNicheSignal } from './sources/appStore.js';
import { findAbandonedRepos } from './sources/github.js';
import { getDemandSignals } from './sources/reddit.js';
import { scoreApp } from './scoring/scoreApp.js';
import { classify, getStrategy, isActionable } from './scoring/classifyOpportunity.js';
import { generateMarkdownReport } from './output/generateReport.js';
import { toCsv } from './output/exportCsv.js';
import { findContact } from './lib/findContact.js';

// ── Config ────────────────────────────────────────────────────────────────────

const CFG = {
  phase1AppsPerNiche: 10,
  phase2AppsPerNiche: 15,
  phase2TopNiches: 5,
  reviewTopApps: 15,        // more review candidates
  externalSignalNiches: 3,
  detailDelay: 1000,
};

// ── Niches — utility/productivity built 2013-2019 ─────────────────────────────

const ALL_NICHES = [
  { term: 'pdf',         label: 'PDF Tools',          category: 'utility' },
  { term: 'converter',   label: 'Unit Converter',      category: 'utility' },
  { term: 'calculator',  label: 'Calculator',          category: 'utility' },
  { term: 'compass',     label: 'Compass',             category: 'utility' },
  { term: 'barcode',     label: 'Barcode Scanner',     category: 'utility' },
  { term: 'habit',       label: 'Habit Tracker',       category: 'productivity' },
  { term: 'expense',     label: 'Expense Tracker',     category: 'productivity' },
  { term: 'timer',       label: 'Timer',               category: 'productivity' },
  { term: 'notepad',     label: 'Notepad',             category: 'productivity' },
  { term: 'budget',      label: 'Budget',              category: 'productivity' },
  { term: 'flashcard',   label: 'Flashcards',          category: 'education' },
  { term: 'dictionary',  label: 'Dictionary',          category: 'education' },
  { term: 'quiz',        label: 'Quiz',                category: 'education' },
  { term: 'ringtone',    label: 'Ringtone',            category: 'entertainment' },
  { term: 'wallpaper',   label: 'Wallpaper',           category: 'entertainment' },
  { term: 'calorie',     label: 'Calorie Counter',     category: 'health' },
  { term: 'meditation',  label: 'Meditation',          category: 'health' },
  { term: 'prayer',      label: 'Prayer Times',        category: 'religious' },
  { term: 'currency',    label: 'Currency Converter',  category: 'finance' },
  { term: 'weather',     label: 'Weather',             category: 'utility' },
];

// ── I/O ───────────────────────────────────────────────────────────────────────

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function save(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ── Niche stats ───────────────────────────────────────────────────────────────

function nicheStats(label, term, apps) {
  if (!apps.length) return null;
  // Exclude big company apps from stats so niche scores aren't inflated by Xiaomi/Samsung
  const valid = apps.filter(a => !a.disqualified);
  if (!valid.length) return null;

  const avg = key => Math.round(valid.reduce((s, a) => s + (a[key] || 0), 0) / valid.length);
  const best = [...valid].sort((a, b) => b.opportunityScore - a.opportunityScore)[0];

  return {
    niche: label, term,
    apps: valid.length,
    disqualified: apps.length - valid.length,
    avgScore: avg('opportunityScore'),
    avgDays: avg('daysSinceUpdate'),
    pctAbandoned: Math.round(valid.filter(a => a.daysSinceUpdate >= 365).length / valid.length * 100),
    strong: valid.filter(a => a.classification?.startsWith('Strong')).length,
    acquire: valid.filter(a => a.classification?.includes('acquisition')).length,
    rebuild: valid.filter(a => a.classification?.includes('rebuild')).length,
    bestApp: best?.title?.substring(0, 35),
    bestScore: best?.opportunityScore,
  };
}

// ── Phase 1 ───────────────────────────────────────────────────────────────────

async function phase1() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`PHASE 1 — Quick scan: ${ALL_NICHES.length} niches × ${CFG.phase1AppsPerNiche} apps`);
  console.log('  ★=strong  ◆=possible  ·=skip(bigco)  .=weak');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const seen = new Set();
  const byNiche = {};

  for (const niche of ALL_NICHES) {
    process.stdout.write(`\n[${niche.label}] `);
    const searchResults = await searchApps(niche.term, CFG.phase1AppsPerNiche);
    const apps = [];

    for (const r of searchResults) {
      if (seen.has(r.appId)) { process.stdout.write('='); continue; }
      seen.add(r.appId);

      try {
        const details = await getAppDetails(r.appId);
        const scored = scoreApp({ ...details, niche: niche.label });
        scored.classification = classify(scored);
        scored.strategy = getStrategy(scored);
        apps.push(scored);

        if (scored.disqualified) process.stdout.write('·');
        else if (scored.opportunityScore >= 80) process.stdout.write('★');
        else if (scored.opportunityScore >= 55) process.stdout.write('◆');
        else process.stdout.write('.');

        await sleep(CFG.detailDelay);
      } catch {
        process.stdout.write('✗');
      }
    }

    byNiche[niche.label] = { apps, stats: nicheStats(niche.label, niche.term, apps) };
  }

  return { byNiche, seen };
}

// ── Phase 2 ───────────────────────────────────────────────────────────────────

async function phase2(nicheRanking, seen) {
  const topNiches = nicheRanking.slice(0, CFG.phase2TopNiches);
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`PHASE 2 — Deep scan: top ${topNiches.length} niches`);
  console.log(`  ${topNiches.map(n => n.niche).join(' | ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const newApps = [];

  for (const nd of topNiches) {
    process.stdout.write(`\n[${nd.niche}] `);
    const searchResults = await searchApps(nd.term, CFG.phase1AppsPerNiche + CFG.phase2AppsPerNiche);

    for (const r of searchResults) {
      if (seen.has(r.appId)) continue;
      seen.add(r.appId);

      try {
        const details = await getAppDetails(r.appId);
        const scored = scoreApp({ ...details, niche: nd.niche });
        scored.classification = classify(scored);
        scored.strategy = getStrategy(scored);
        newApps.push(scored);

        if (scored.disqualified) process.stdout.write('·');
        else if (scored.opportunityScore >= 80) process.stdout.write('★');
        else if (scored.opportunityScore >= 55) process.stdout.write('◆');
        else process.stdout.write('.');

        await sleep(CFG.detailDelay);
      } catch {
        process.stdout.write('✗');
      }
    }
  }

  return newApps;
}

// ── Phase 3 — Review mining ───────────────────────────────────────────────────

async function phase3(candidates) {
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`PHASE 3 — Review mining: ${candidates.length} candidates`);
  console.log('  (prioritizing low-rated, high-install, non-bigco apps)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const app of candidates) {
    process.stdout.write(`  ${app.title?.substring(0, 38)}...`);
    const analysis = await getReviewAnalysis(app.appId, 60);

    if (!analysis) { console.log(' no reviews'); continue; }

    app.reviewAnalysis = analysis;
    app.mainComplaints = analysis.complaints;

    // Apply score boosts based on review evidence
    if (analysis.complaints.includes('crashes') || analysis.complaints.includes('bugs')) {
      app.opportunityScore += 10;
      app.rebuildSignal = 'Fixable technical issues confirmed by reviews';
    } else if (analysis.complaints.includes('ads') || analysis.complaints.includes('badUI')) {
      app.opportunityScore += 5;
      app.rebuildSignal = 'UX/monetization issues confirmed by reviews';
    }

    // Re-classify with updated score
    app.classification = classify(app);
    app.strategy = getStrategy(app);

    const dist = analysis.distribution;
    console.log(
      ` ${analysis.sentiment} | ` +
      `1★:${dist[1]} 2★:${dist[2]} 3★:${dist[3]} | ` +
      `complaints: [${analysis.complaints.join(', ') || 'none'}]`
    );
    await sleep(800);
  }
}

// ── Phase 3b — Contact enrichment ─────────────────────────────────────────────
// For every top acquisition candidate missing an email, find one automatically.

async function phase3b(acquisitionCandidates) {
  const missing = acquisitionCandidates.filter(a => !a.developerEmail);
  if (!missing.length) {
    console.log('\n[Contact Enrichment] All top apps already have emails — skipping.');
    return;
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`PHASE 3b — Contact enrichment: ${missing.length} apps missing email`);
  console.log('  Scraping developer websites + GitHub search...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const app of missing) {
    process.stdout.write(`  ${app.title?.substring(0, 35)}... `);
    try {
      const contact = await findContact({
        developerName: app.developer,
        websiteUrl: app.developerWebsite,
        existingEmail: app.developerEmail,
      });

      if (contact.email) {
        app.developerEmail = contact.email;
        app.contactSource = contact.emailSource;
        console.log(`✓ ${contact.email} (${contact.emailSource})`);
      } else if (contact.github) {
        app.developerGithub = contact.github;
        app.contactSource = 'github';
        console.log(`GitHub: ${contact.github}`);
      } else if (contact.guessedEmails.length) {
        app.emailGuesses = contact.guessedEmails;
        app.contactSource = 'guessed';
        console.log(`guessed: ${contact.guessedEmails[0]}`);
      } else {
        console.log(`not found (reachability: ${contact.reachability})`);
      }
    } catch (err) {
      console.log(`error: ${err.message}`);
    }
    await sleep(1000);
  }
}

// ── Phase 4 — External signals ────────────────────────────────────────────────

async function phase4(nicheRanking) {
  const topNiches = nicheRanking.slice(0, CFG.externalSignalNiches);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`PHASE 4 — External signals: GitHub + Reddit + App Store`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const signals = {};

  for (const nd of topNiches) {
    console.log(`\n[${nd.niche}]`);

    process.stdout.write('  GitHub...');
    const github = await findAbandonedRepos(nd.term);
    console.log(` ${github.rateLimited ? 'rate limited' : `${github.repos?.length || 0} abandoned repos`}`);
    await sleep(2500);

    process.stdout.write('  Reddit...');
    const reddit = await getDemandSignals(nd.term);
    console.log(` demand: ${reddit.demandStrength} (${reddit.totalEngagement.toLocaleString()} engagement)`);
    await sleep(1000);

    process.stdout.write('  App Store...');
    const ios = await getNicheSignal(nd.term);
    console.log(` ${ios.available ? ios.crossPlatformSignal : 'unavailable'}`);

    signals[nd.niche] = { github, reddit, ios };
  }

  return signals;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  const ts = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').slice(0, -1);

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  AppScout Research Engine v2.1                     ║');
  console.log('║  Precision-focused — big company filter active      ║');
  console.log('╚════════════════════════════════════════════════════╝');

  // ── Phases ────────────────────────────────────────────────────────────────

  const { byNiche, seen } = await phase1();

  const nicheRanking = Object.values(byNiche)
    .map(d => d.stats)
    .filter(Boolean)
    .sort((a, b) => b.avgScore - a.avgScore);

  save('data/processed/phase1-niche-ranking.json', nicheRanking);

  const phase2Apps = await phase2(nicheRanking, seen);

  const allApps = [
    ...Object.values(byNiche).flatMap(d => d.apps),
    ...phase2Apps,
  ].sort((a, b) => b.opportunityScore - a.opportunityScore);

  save('data/raw/all-apps.json', allApps);

  // Phase 3: prioritize apps where reviews will reveal real problems
  // Criteria: not big company + lower rating (3.0-3.8) + high installs = most complaint-rich
  const reviewCandidates = allApps
    .filter(a => !a.disqualified && (a.minInstalls || 0) >= 50_000)
    .sort((a, b) => {
      // Score = demand × inverse rating (we want high installs + low rating)
      const score = (r) => Math.log10(r.minInstalls || 1) * (4.5 - Math.max(3.0, Math.min(5, r.score || 4.5)));
      return score(b) - score(a);
    })
    .slice(0, CFG.reviewTopApps);

  await phase3(reviewCandidates);

  // Enrich contact info for top acquisition targets missing an email
  const topAcquisition = allApps
    .filter(a => !a.disqualified && a.daysSinceUpdate >= 365)
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 20);
  await phase3b(topAcquisition);

  allApps.sort((a, b) => b.opportunityScore - a.opportunityScore);
  save('data/processed/scored-apps.json', allApps);

  const externalSignals = await phase4(nicheRanking);
  save('data/processed/external-signals.json', externalSignals);

  // ── Separate results into clean buckets ──────────────────────────────────

  const actionable = allApps.filter(a => isActionable(a));
  const acquisitionTargets = actionable.filter(a => a.strategy === 'Contact developer');
  const rebuildTargets = actionable.filter(a => a.strategy === 'Build better version');
  const falsePositives = allApps.filter(a =>
    a.classification?.includes('False positive') ||
    a.classification === 'Active — skip' ||
    a.disqualified
  );

  // ── Generate report ───────────────────────────────────────────────────────

  const reportData = {
    timestamp: new Date().toISOString(),
    stats: {
      totalApps: allApps.length,
      disqualified: allApps.filter(a => a.disqualified).length,
      actionable: actionable.length,
      acquisitionTargets: acquisitionTargets.length,
      rebuildTargets: rebuildTargets.length,
      totalNiches: ALL_NICHES.length,
    },
    topOpportunities: actionable.slice(0, 20),
    acquisitionTargets: acquisitionTargets.slice(0, 10),
    rebuildTargets: rebuildTargets.slice(0, 10),
    nicheRanking,
    falsePositives: falsePositives.slice(0, 20),
    externalSignals,
  };

  save(`data/reports/report-${ts}.json`, reportData);
  ensureDir('data/reports');
  fs.writeFileSync(`data/reports/report-${ts}.md`, generateMarkdownReport(reportData));
  fs.writeFileSync('data/reports/opportunities.csv', toCsv(actionable));

  // ── Console output ────────────────────────────────────────────────────────

  const elapsed = Math.round((Date.now() - t0) / 1000);

  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  NICHE RANKINGS  (big company apps excluded from stats)        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.table(nicheRanking.map(n => ({
    niche: n.niche,
    valid: n.apps,
    removed: n.disqualified,
    'avg score': n.avgScore,
    '% old': `${n.pctAbandoned}%`,
    acquire: n.acquire,
    rebuild: n.rebuild,
  })));

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TOP 10 ACQUISITION TARGETS                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.table(acquisitionTargets.slice(0, 10).map(a => ({
    title: a.title?.substring(0, 28),
    niche: a.niche,
    installs: a.installs,
    rating: a.score?.toFixed(2) ?? 'N/A',
    'days old': a.daysSinceUpdate,
    score: a.opportunityScore,
    owner: a.ownerType,
    email: a.developerEmail?.substring(0, 30) || (a.emailGuesses?.[0] ? `~${a.emailGuesses[0]}` : '—'),
    contactSrc: a.contactSource || (a.developerEmail ? 'play-store' : '—'),
    complaints: (a.mainComplaints || []).slice(0, 2).join('+') || '—',
  })));

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TOP 10 REBUILD OPPORTUNITIES                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.table(rebuildTargets.slice(0, 10).map(a => ({
    title: a.title?.substring(0, 28),
    niche: a.niche,
    installs: a.installs,
    rating: a.score?.toFixed(2) ?? 'N/A',
    'days old': a.daysSinceUpdate,
    score: a.opportunityScore,
    sentiment: a.reviewAnalysis?.sentiment || '—',
    complaints: (a.mainComplaints || []).slice(0, 3).join('+') || '—',
  })));

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  FALSE POSITIVES REMOVED                                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  const fpSample = falsePositives.slice(0, 10);
  console.table(fpSample.map(a => ({
    title: a.title?.substring(0, 30),
    developer: a.developer?.substring(0, 25),
    reason: a.classification?.substring(0, 35),
    installs: a.installs,
  })));

  console.log(`\n✓ Done in ${elapsed}s`);
  console.log(`✓ ${allApps.length} apps scored | ${allApps.filter(a => a.disqualified).length} disqualified (big company)`);
  console.log(`✓ ${acquisitionTargets.length} acquisition targets | ${rebuildTargets.length} rebuild opportunities`);
  console.log(`✓ Report → data/reports/report-${ts}.md`);
  console.log(`✓ CSV    → data/reports/opportunities.csv\n`);
}

main().catch(console.error);
