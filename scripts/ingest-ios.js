// Runs the iOS App Store scanner and merges results into web/data/opportunities.json.
// Output rows use the same shape as the Android entries so the dashboard, loader,
// and AI predictor treat them identically.

import fs from 'fs';
import path from 'path';
import { findAbandonedIOSApps } from '../sources/appStore.js';

const OUT = path.join('web', 'data', 'opportunities.json');

function mapIOSToOpportunity(app) {
  return {
    title: app.name,
    appId: app.bundleId || String(app.id),
    url: app.appStoreUrl,
    developer: app.developer,
    developerEmail: app.contact?.email || undefined,
    developerWebsite: app.websiteUrl || undefined,
    developerSupport: app.supportUrl || undefined,
    installs: undefined,
    minInstalls: undefined,
    score: app.rating,
    ratings: app.ratingCount,
    reviews: 0,
    updatedDate: app.lastUpdate,
    released: undefined,
    free: app.price === 0,
    offersIAP: false,
    adSupported: false,
    recentChanges: '',
    platform: 'ios',
    niche: app.niche,
    daysSinceUpdate: app.staleDays,
    ownerType: 'Solo indie',
    disqualified: false,
    scoring: {
      demand: app.ratingCount >= 10000 ? 30 : app.ratingCount >= 1000 ? 20 : 10,
      abandonment: app.staleDays >= 730 ? 30 : app.staleDays >= 365 ? 20 : 10,
      rating: app.rating >= 4.0 ? 20 : app.rating >= 3.5 ? 15 : 10,
      reachability: app.contact?.email ? 15 : 5,
      monetization: 10,
      risk: 0,
      ownerRisk: 0,
    },
    opportunityScore: app.score,
    classification: app.staleDays >= 365 ? 'Possible acquisition target' : 'Rebuild candidate',
    strategy: 'Contact developer',
  };
}

async function main() {
  console.log('[ingest-ios] scanning App Store...');
  const ios = await findAbandonedIOSApps();
  console.log(`[ingest-ios] ${ios.length} iOS candidates from App Store`);

  if (!fs.existsSync(OUT)) {
    console.error(`[ingest-ios] ${OUT} not found — aborting`);
    process.exit(1);
  }

  const existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const existingKeys = new Set(
    existing.map((a) => `${a.platform || 'android'}::${a.appId}`)
  );

  const mapped = ios
    .map(mapIOSToOpportunity)
    .filter((a) => !existingKeys.has(`ios::${a.appId}`));

  const merged = [...existing, ...mapped];
  fs.writeFileSync(OUT, JSON.stringify(merged, null, 2));
  console.log(`[ingest-ios] added ${mapped.length} new iOS apps · ${merged.length} total in ${OUT}`);
}

main().catch((err) => {
  console.error('[ingest-ios] failed:', err);
  process.exit(1);
});
