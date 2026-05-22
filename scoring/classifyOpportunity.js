export function classify(app) {
  const { opportunityScore, minInstalls, daysSinceUpdate, developerEmail,
    score, ownerType, disqualified } = app;

  // Hard disqualifiers
  if (disqualified || ownerType === 'Big company') return 'False positive — big company';
  if (daysSinceUpdate < 90 && (score || 0) > 4.2) return 'Active — skip';
  if ((minInstalls || 0) < 5_000) return 'Too small';

  const old = daysSinceUpdate >= 365;
  const veryOld = daysSinceUpdate >= 730;
  const bigEnough = (minInstalls || 0) >= 100_000;
  const reachable = !!developerEmail;
  const healthyRating = score && score >= 3.0;
  const weakRating = score && score < 3.5;
  const portfolioOwned = ownerType === 'Portfolio/acquirer';

  // Strong acquisition: genuinely old indie/small studio app with real demand
  if (bigEnough && veryOld && reachable && healthyRating && !portfolioOwned) {
    return 'Strong acquisition target';
  }

  // Possible acquisition
  if (bigEnough && old && reachable && healthyRating) {
    return portfolioOwned ? 'Possible acquisition target — portfolio-owned' : 'Possible acquisition target';
  }

  // Rebuild: proven demand + weak product, may not be acquirable
  if ((minInstalls || 0) >= 100_000 && weakRating) {
    return 'Strong rebuild opportunity';
  }
  if ((minInstalls || 0) >= 50_000 && old) {
    return 'Rebuild opportunity';
  }

  if (opportunityScore >= 55) return 'Possible acquisition target';
  if (opportunityScore >= 35) return 'Needs research';
  return 'Ignore';
}

export function getStrategy(app) {
  const c = app.classification || '';
  if (c.includes('False positive') || c === 'Ignore' || c === 'Active — skip' || c === 'Too small') return 'Skip';
  if (c.includes('acquisition')) return 'Contact developer';
  if (c.includes('rebuild')) return 'Build better version';
  return 'Skip';
}

export function isActionable(app) {
  const s = app.strategy;
  return s === 'Contact developer' || s === 'Build better version';
}
