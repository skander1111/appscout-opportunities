import { classifyOwner, ownerRiskPenalty } from './classifyOwner.js';

export function daysSince(dateStr) {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr)) / 86_400_000);
}

function demandScore(minInstalls) {
  if (!minInstalls) return 0;
  if (minInstalls >= 10_000_000) return 40;
  if (minInstalls >= 1_000_000) return 35;
  if (minInstalls >= 500_000) return 30;
  if (minInstalls >= 100_000) return 25;
  if (minInstalls >= 50_000) return 15;
  if (minInstalls >= 10_000) return 10;
  return 0;
}

function abandonmentScore(days) {
  if (days >= 365 * 3) return 40;
  if (days >= 365 * 2) return 35;
  if (days >= 365) return 25;
  if (days >= 180) return 10;
  return 0;
}

function ratingOpportunityScore(score) {
  if (!score) return 0;
  if (score < 3.0) return -15;
  if (score <= 4.0) return 20;  // sweet spot: bad enough users want alternative, good enough demand exists
  if (score <= 4.3) return 10;
  return 0; // > 4.3 = well-maintained, low opportunity
}

function monetizationScore(app) {
  let s = 0;
  if (app.offersIAP) s += 10;
  if (app.adSupported) s += 5;
  if (app.free) s += 5;
  return s;
}

function baseRiskPenalty(app, days) {
  let r = 0;
  if ((app.minInstalls || 0) < 10_000) r += 15;
  if (!app.developerEmail) r += 15;
  if (app.score && app.score < 3.0) r += 15; // likely spam/broken, not opportunity
  if (days < 180) r += 20; // too recent, not abandoned
  return r;
}

export function scoreApp(app) {
  const days = daysSince(app.updatedDate);
  const ownerType = classifyOwner(app);
  const ownerRisk = ownerRiskPenalty(ownerType);

  const demand = demandScore(app.minInstalls);
  const abandonment = abandonmentScore(days);
  const rating = ratingOpportunityScore(app.score);
  const reachability = app.developerEmail ? 10 : -10;
  const monetization = monetizationScore(app);
  const baseRisk = baseRiskPenalty(app, days);
  const totalRisk = baseRisk + ownerRisk;

  const opportunityScore = Math.min(100, demand + abandonment + rating + reachability + monetization - totalRisk);

  return {
    ...app,
    daysSinceUpdate: days,
    ownerType,
    disqualified: ownerType === 'Big company',
    scoring: { demand, abandonment, rating, reachability, monetization, risk: totalRisk, ownerRisk },
    opportunityScore,
  };
}
