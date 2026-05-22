const HEADERS = { 'User-Agent': 'AppScout/1.0 (research tool)' };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Searches that find active demand
const DEMAND_QUERIES = (term) => [
  `best ${term} app android`,
  `${term} app alternative android`,
  `${term} android no ads`,
  `${term} app recommendation`,
];

// Searches that find abandoned builders or frustrated users
const BUILDER_QUERIES = (term) => [
  `"${term}" app "no longer" OR abandoned OR "not maintained"`,
  `"${term}" android "looking for" alternative`,
  `"${term}" "side project" OR "I built" OR "I made"`,
];

// Subreddits with high signal for our use case
const TARGET_SUBREDDITS = [
  'androidapps', 'Android', 'indiehacking', 'SideProject',
  'startups', 'entrepreneur', 'AppStore', 'flutterdev',
];

async function searchReddit(query, sort = 'top', timeframe = 'year', limit = 8) {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=${sort}&t=${timeframe}&limit=${limit}&type=link`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];

    const data = await res.json();
    return (data?.data?.children || []).map(({ data: p }) => ({
      title: p.title,
      subreddit: `r/${p.subreddit}`,
      score: p.score,
      comments: p.num_comments,
      date: new Date(p.created_utc * 1000).toISOString().split('T')[0],
      url: `https://reddit.com${p.permalink}`,
      selftext_snippet: (p.selftext || '').substring(0, 200),
      author: p.author,
      flair: p.link_flair_text || null,
    }));
  } catch {
    return [];
  }
}

async function searchSubreddit(subreddit, query, limit = 5) {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=top&t=all&limit=${limit}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children || []).map(({ data: p }) => ({
      title: p.title,
      subreddit: `r/${p.subreddit}`,
      score: p.score,
      comments: p.num_comments,
      date: new Date(p.created_utc * 1000).toISOString().split('T')[0],
      url: `https://reddit.com${p.permalink}`,
      author: p.author,
    }));
  } catch {
    return [];
  }
}

export async function getDemandSignals(term) {
  const posts = [];
  const seen = new Set();

  for (const q of DEMAND_QUERIES(term)) {
    const results = await searchReddit(q);
    for (const p of results) {
      if (!seen.has(p.url)) { seen.add(p.url); posts.push(p); }
    }
    await sleep(1200);
  }

  const engagement = posts.reduce((s, p) => s + p.score + p.comments, 0);
  const top = [...posts].sort((a, b) => b.score - a.score)[0];

  return {
    postCount: posts.length,
    totalEngagement: engagement,
    demandStrength: engagement > 1000 ? 'High' : engagement > 200 ? 'Medium' : 'Low',
    topPost: top ? { title: top.title.substring(0, 80), score: top.score, url: top.url } : null,
    posts: posts.slice(0, 5),
  };
}

export async function findAbandonedBuilders(term) {
  const posts = [];
  const seen = new Set();

  // Global abandoned builder search
  for (const q of BUILDER_QUERIES(term)) {
    const results = await searchReddit(q, 'relevance', 'all', 5);
    for (const p of results) {
      if (!seen.has(p.url)) { seen.add(p.url); posts.push({ ...p, signalType: 'abandoned_builder' }); }
    }
    await sleep(1500);
  }

  // Targeted subreddit search
  for (const sub of ['indiehacking', 'SideProject', 'androidapps']) {
    const results = await searchSubreddit(sub, term, 3);
    for (const p of results) {
      if (!seen.has(p.url)) { seen.add(p.url); posts.push({ ...p, signalType: 'community' }); }
    }
    await sleep(1000);
  }

  // Score each post
  const scored = posts.map(p => ({
    ...p,
    relevanceScore: scoreBuilderPost(p),
  })).filter(p => p.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    posts: scored.slice(0, 5),
    builderSignals: scored.filter(p => p.signalType === 'abandoned_builder').length,
    communitySignals: scored.filter(p => p.signalType === 'community').length,
  };
}

// Subreddits with high seller signal density
const HIGH_SIGNAL_SUBS = ['r/indiehacking', 'r/SideProject', 'r/AppBusiness', 'r/androidapps', 'r/entrepreneur'];
const LOW_SIGNAL_SUBS  = ['r/linux', 'r/CreditCards', 'r/news', 'r/programming'];

// Drop posts older than 18 months — too stale to be actionable
const MAX_POST_AGE_DAYS = 548;

function scoreBuilderPost(post) {
  // Hard filters first
  const postAge = Math.floor((Date.now() - new Date(post.date)) / 86_400_000);
  if (postAge > MAX_POST_AGE_DAYS) return 0;
  if (LOW_SIGNAL_SUBS.includes(post.subreddit)) return 0;

  let score = 0;
  const text = (post.title + ' ' + (post.selftext_snippet || '')).toLowerCase();

  // Must mention selling/transfer — not just "abandoned" in general
  const isSellerPost = /selling|for sale|looking to sell|want to sell|take over|acquire|buy.*app|app.*sale/i.test(text);
  if (!isSellerPost) return 0;

  // Builder signals — they built it themselves
  if (/i built|i made|i created|i developed|my app|my project|side project/i.test(text)) score += 20;

  // Price mentioned = motivated, real seller
  if (/\$[\d,]+|\€[\d,]+|£[\d,]+|usd|asking price|priced at/i.test(text)) score += 30;

  // Platform signals
  if (/android|ios|play.?store|app.?store|flutter|react.?native/i.test(text)) score += 15;

  // Recency bonus
  if (postAge <= 30)  score += 20;
  else if (postAge <= 90)  score += 12;
  else if (postAge <= 180) score += 6;

  // Subreddit quality
  if (HIGH_SIGNAL_SUBS.includes(post.subreddit)) score += 10;

  // Engagement weight
  if (post.score > 100) score += 10;
  else if (post.score > 20) score += 5;
  if (post.comments > 20) score += 5;

  return score;
}

export async function findNicheDemand(niches) {
  const results = {};
  for (const niche of niches) {
    results[niche] = await getDemandSignals(niche);
    await sleep(2000);
  }
  return results;
}

// Search for posts where someone says "I'm selling my app" or "take over my project"
export async function findDirectSellers() {
  const queries = [
    '"selling my app" android',
    '"for sale" android app "indie developer"',
    '"take over" android app "open source"',
    '"no longer maintaining" android app',
    '"acquired" OR "acquisition" indie android app',
  ];

  const posts = [];
  const seen = new Set();

  for (const q of queries) {
    const results = await searchReddit(q, 'relevance', 'all', 6);
    for (const p of results) {
      if (!seen.has(p.url) && scoreBuilderPost(p) > 15) {
        seen.add(p.url);
        posts.push({ ...p, relevanceScore: scoreBuilderPost(p) });
      }
    }
    await sleep(1500);
  }

  return posts.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
}
