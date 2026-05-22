// Safety gate — every lead must pass before it enters the queue

const ALLOWED_OWNER_TYPES = ['Solo indie', 'Small studio'];
const HIGH_RISK_NICHES = ['Ringtone']; // copyright/licensing exposure
const MIN_INSTALLS = 50_000;
const MIN_DAYS_INACTIVE = 180;
const MIN_SCORE = 65;

export function verifyLead(app, existingQueue) {
  const reasons = [];

  // Hard blocks
  if (app.disqualified || app.ownerType === 'Big company')
    reasons.push('big company or system app');

  if (!app.developerEmail)
    reasons.push('no developer email found');

  if (!ALLOWED_OWNER_TYPES.includes(app.ownerType))
    reasons.push(`owner type "${app.ownerType}" not suitable for cold outreach`);

  if ((app.minInstalls || 0) < MIN_INSTALLS)
    reasons.push(`install base too small (${app.minInstalls?.toLocaleString() || 0} < ${MIN_INSTALLS.toLocaleString()})`);

  if ((app.daysSinceUpdate || 0) < MIN_DAYS_INACTIVE)
    reasons.push(`updated recently (${app.daysSinceUpdate} days ago — not clearly abandoned)`);

  if ((app.opportunityScore || 0) < MIN_SCORE)
    reasons.push(`opportunity score too low (${app.opportunityScore} < ${MIN_SCORE})`);

  if (HIGH_RISK_NICHES.includes(app.niche))
    reasons.push(`niche "${app.niche}" has copyright/licensing risk`);

  // Duplicate checks
  const alreadyQueued = existingQueue.some(
    q => q.developerEmail === app.developerEmail
  );
  if (alreadyQueued)
    reasons.push('already in outreach queue');

  // Soft warnings (don't block, but add to notes)
  const warnings = [];
  if (app.ownerType === 'Portfolio/acquirer')
    warnings.push('portfolio-owned — may already know the acquisition game, price could be higher');
  if ((app.score || 5) < 3.0)
    warnings.push('very poor rating — users may have abandoned the app too, not just the developer');
  if (!app.recentChanges && app.daysSinceUpdate > 700)
    warnings.push('no recent changes listed — confirm app still functions before contacting');

  return {
    approved: reasons.length === 0,
    reasons,
    warnings,
  };
}
