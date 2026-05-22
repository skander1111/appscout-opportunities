import gplay from 'google-play-scraper';

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// gplay.search() is broken (Google changed their HTML) — scrape IDs directly then look up each
async function searchAppIds(term, num = 20) {
  try {
    const url = `https://play.google.com/store/search?q=${encodeURIComponent(term)}&c=apps&hl=en&gl=us`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0' },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const ids = [...html.matchAll(/\/store\/apps\/details\?id=([\w.]+)/g)].map(m => m[1]);
    return [...new Set(ids)].slice(0, num);
  } catch {
    return [];
  }
}

export async function searchApps(term, num = 10) {
  const ids = await searchAppIds(term, num);
  const results = [];
  for (const appId of ids) {
    try {
      const d = await gplay.app({ appId, lang: 'en', country: 'us' });
      results.push(d);
      await sleep(300);
    } catch {
      // skip unavailable app
    }
  }
  return results;
}

export async function getAppDetails(appId) {
  const d = await gplay.app({ appId, lang: 'en', country: 'us' });
  return {
    title: d.title,
    appId: d.appId,
    url: d.url,
    developer: d.developer,
    developerEmail: d.developerEmail || null,
    installs: d.installs,
    minInstalls: d.minInstalls || 0,
    score: d.score || null,
    ratings: d.ratings || 0,
    reviews: d.reviews || 0,
    updatedDate: d.updated ? new Date(d.updated).toISOString().split('T')[0] : null,
    released: d.released || null,
    free: d.free,
    offersIAP: d.offersIAP || false,
    adSupported: d.adSupported || false,
    recentChanges: d.recentChanges || null,
    platform: 'android',
  };
}

export async function getReviewAnalysis(appId, num = 60) {
  let reviews = [];

  try {
    // Fetch newest reviews
    const result = await gplay.reviews({
      appId, lang: 'en', country: 'us',
      sort: gplay.sort.NEWEST, num,
    });
    reviews = Array.isArray(result) ? result : (result?.data || []);
  } catch {
    return null;
  }

  if (!reviews.length) return null;

  // Score distribution
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const s = Math.round(r.score || r.rating || 0);
    if (s >= 1 && s <= 5) dist[s]++;
  }

  const lowScoreReviews = reviews.filter(r => (r.score || r.rating || 5) <= 2);
  const recentCutoff = Date.now() - 90 * 86_400_000;
  const recentCount = reviews.filter(r => {
    try { return new Date(r.date).getTime() > recentCutoff; } catch { return false; }
  }).length;

  // Extract complaint themes from low-score reviews
  const complaints = extractComplaints(lowScoreReviews.length >= 3 ? lowScoreReviews : reviews);

  // Sample worst reviews for display
  const worstReviews = lowScoreReviews.slice(0, 3).map(r => ({
    score: r.score,
    text: (r.text || '').substring(0, 200),
    date: typeof r.date === 'string' ? r.date.substring(0, 10) : String(r.date || '').substring(0, 10),
  }));

  return {
    totalFetched: reviews.length,
    distribution: dist,
    lowScoreCount: lowScoreReviews.length,
    lowScorePct: Math.round(lowScoreReviews.length / reviews.length * 100),
    recentActivity: recentCount,
    complaints,
    worstReviews,
    sentiment: sentimentLabel(dist, reviews.length),
  };
}

const COMPLAINT_PATTERNS = {
  crashes:   /crash|force.?clos|stop.?work|won.?t.?open|keeps.?clos|app.?died/i,
  ads:       /too.?many.?ads?|constant.?ads?|popup|intrusive.?ad|ad.?every|full.?screen.?ad/i,
  outdated:  /old|outdated|needs?.?update|ancient|years?.?without|abandoned|dead.?app/i,
  badUI:     /ugly|bad.?design|old.?ui|horrible.?interface|outdated.?design|redesign/i,
  slow:      /so.?slow|very.?slow|lags?|freeze|sluggish|drain.?battery/i,
  bugs:      /bug|glitch|broken|doesn.?t.?work|error|not.?working|fix.?this/i,
  missing:   /need.?(to.?add|feature)|missing.?feature|wish.?(it.?had|there.?was)|please.?add/i,
};

function extractComplaints(reviews) {
  if (!reviews.length) return [];
  const counts = {};
  for (const [type, pattern] of Object.entries(COMPLAINT_PATTERNS)) {
    counts[type] = reviews.filter(r => pattern.test(r.text || '')).length;
  }
  // Lower threshold: any complaint appearing in 5%+ of reviews, minimum 1
  const threshold = Math.max(1, reviews.length * 0.05);
  return Object.entries(counts)
    .filter(([, n]) => n >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);
}

function sentimentLabel(dist, total) {
  if (!total) return 'Unknown';
  const lowPct = ((dist[1] + dist[2]) / total) * 100;
  if (lowPct >= 40) return 'Very negative';
  if (lowPct >= 20) return 'Mostly negative';
  if (lowPct >= 10) return 'Mixed';
  return 'Mostly positive';
}
