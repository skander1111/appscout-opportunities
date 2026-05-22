// iOS App Store — iTunes Search API (public, no auth, no npm package)
// Finds abandoned iOS apps by niche, scores by staleness + ratings

import { findContact } from '../lib/findContact.js';

const SEARCH_API = 'https://itunes.apple.com/search';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const NICHES = [
  'pdf converter', 'unit converter', 'habit tracker', 'expense tracker',
  'interval timer', 'compass', 'meditation', 'barcode scanner',
  'flashcard', 'pomodoro', 'calorie counter', 'workout timer',
  'noise meter', 'metronome', 'guitar tuner', 'chord finder',
  'vocabulary builder', 'trivia quiz', 'ringtone maker', 'wallpaper',
  'sleep sounds', 'white noise', 'prayer times', 'fasting tracker',
];

const BIG_COMPANY = /google|microsoft|amazon|meta|apple|adobe|samsung|bytedance|tencent|alibaba|spotify|netflix|ltd\.|inc\.|corp\.|llc|gmbh|s\.a\./i;

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function scoreApp(app, staleDays) {
  let score = 0;

  // Must be stale enough to be interesting
  if (staleDays >= 730) score += 40;
  else if (staleDays >= 365) score += 30;
  else if (staleDays >= 180) score += 15;
  else return 0;

  // Rating quality
  const rating = app.averageUserRating ?? 0;
  if (rating >= 4.5) score += 20;
  else if (rating >= 4.0) score += 15;
  else if (rating >= 3.5) score += 10;
  else if (rating >= 3.0) score += 5;

  // Rating count = proven user base
  const count = app.userRatingCount ?? 0;
  if (count >= 50000) score += 25;
  else if (count >= 10000) score += 20;
  else if (count >= 5000) score += 15;
  else if (count >= 1000) score += 10;
  else if (count >= 200) score += 5;
  else return 0; // too little proof

  // Free apps easier to pitch (bigger user base)
  if ((app.price ?? 0) === 0) score += 5;

  return Math.min(100, score);
}

async function searchNiche(niche) {
  await sleep(500);
  try {
    const params = new URLSearchParams({ term: niche, entity: 'software', limit: '50', country: 'us' });
    const res = await fetch(`${SEARCH_API}?${params}`, { headers: { 'User-Agent': 'AppScout/1.0' } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

export async function findAbandonedIOSApps() {
  const seen = new Set();
  const results = [];

  for (const niche of NICHES) {
    const apps = await searchNiche(niche);

    for (const app of apps) {
      const id = String(app.trackId);
      if (seen.has(id)) continue;
      seen.add(id);

      // Skip big companies
      const seller = app.sellerName ?? app.artistName ?? '';
      if (BIG_COMPANY.test(seller)) continue;

      const lastUpdate = app.currentVersionReleaseDate ?? app.releaseDate;
      const staleDays = daysSince(lastUpdate);
      const score = scoreApp(app, staleDays);
      if (score === 0) continue;

      results.push({
        source: 'app-store',
        platform: 'ios',
        id,
        name: app.trackName,
        developer: seller,
        websiteUrl: app.sellerUrl || null,
        supportUrl: app.supportUrl || null,
        appStoreUrl: app.trackViewUrl,
        bundleId: app.bundleId,
        category: app.primaryGenreName,
        rating: Number((app.averageUserRating ?? 0).toFixed(2)),
        ratingCount: app.userRatingCount ?? 0,
        price: app.price ?? 0,
        lastUpdate,
        staleDays,
        score,
        niche,
        // Contact enriched below
        contact: null,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, 20);

  // Enrich top results with full contact details
  console.log(`  [App Store] Enriching contact info for ${top.length} iOS apps...`);
  for (const app of top) {
    process.stdout.write(`    · ${app.name}... `);
    try {
      app.contact = await findContact({
        developerName: app.developer,
        websiteUrl: app.websiteUrl,
        supportUrl: app.supportUrl,
        appStoreUrl: app.appStoreUrl,
      });
      const status = app.contact.email
        ? `✓ ${app.contact.email} (${app.contact.emailSource})`
        : app.contact.github
          ? `GitHub: ${app.contact.github}`
          : `reachability: ${app.contact.reachability}`;
      console.log(status);
    } catch (err) {
      console.log(`failed: ${err.message}`);
      app.contact = null;
    }
    await sleep(800);
  }

  return top;
}

// Also export the niche signal helper for backward compatibility
export async function getNicheSignal(term) {
  const apps = await searchNiche(term);
  if (!apps.length) return { available: false, reason: 'no results' };
  const avgRating = apps.reduce((s, a) => s + (a.averageUserRating ?? 0), 0) / apps.length;
  const hasStrong = apps.some(a => (a.userRatingCount ?? 0) > 10000);
  return {
    available: true,
    appCount: apps.length,
    avgRating: Math.round(avgRating * 100) / 100,
    topApp: apps[0]?.trackName,
    hasStrongCompetitors: hasStrong,
    crossPlatformSignal: apps.length >= 3 ? 'Niche active on iOS' : 'Weak iOS presence',
    expansionOpportunity: !hasStrong,
  };
}
