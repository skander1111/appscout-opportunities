// IndieHackers — public product/post discovery
// Finds apps posted by builders who may have moved on

const HEADERS = { 'User-Agent': 'AppScout/1.0' };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr)) / 86_400_000);
}

function scoreIHProduct(product) {
  let score = 0;

  // Revenue signal
  const revenue = product.revenueRange || '';
  if (revenue.includes('0')) score += 5;       // zero revenue = possibly stale
  else if (revenue.includes('1-')) score += 10; // tiny revenue = solo indie

  // Upvotes = demand proxy
  if (product.upvotes >= 100) score += 25;
  else if (product.upvotes >= 50) score += 18;
  else if (product.upvotes >= 20) score += 12;
  else if (product.upvotes >= 5) score += 6;

  // Mobile/app signal
  const text = ((product.name || '') + ' ' + (product.tagline || '') + ' ' + (product.description || '')).toLowerCase();
  if (/android|ios|mobile|flutter|react.native/i.test(text)) score += 15;
  if (/app|application/i.test(text)) score += 5;

  // Staleness (last activity)
  const age = daysSince(product.lastActivityDate || product.createdAt);
  if (age >= 365 * 2) score += 25;
  else if (age >= 365) score += 15;
  else if (age >= 180) score += 5;

  return Math.min(100, score);
}

async function fetchIHProducts(query) {
  // IndieHackers public search endpoint
  try {
    const url = `https://www.indiehackers.com/products?search=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];

    // IH returns HTML — extract JSON from __NEXT_DATA__ script tag
    const html = await res.text();
    const match = html.match(/"products":\s*(\[[\s\S]*?\])\s*[,}]/);
    if (!match) return [];

    const products = JSON.parse(match[1]);
    return products;
  } catch {
    return [];
  }
}

// Alternative: search IH via their Algolia-like API pattern
async function searchIHPosts(query) {
  try {
    const url = `https://www.indiehackers.com/api/v1/posts?search=${encodeURIComponent(query)}&limit=10`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || data.posts || [];
  } catch {
    return [];
  }
}

export async function findAbandonedProducts(term) {
  const products = await fetchIHProducts(term);

  const scored = products
    .filter(p => p && (p.name || p.title))
    .map(p => {
      const score = scoreIHProduct(p);
      return {
        name: p.name || p.title,
        tagline: p.tagline || p.description?.substring(0, 100),
        url: p.url ? `https://www.indiehackers.com${p.url}` : null,
        externalUrl: p.website || null,
        founder: p.userId || p.founders?.[0] || null,
        upvotes: p.upvotes || p.voteCount || 0,
        revenue: p.revenueRange || 'unknown',
        createdAt: p.createdAt,
        lastActivity: p.lastActivityDate,
        daysSinceActivity: daysSince(p.lastActivityDate || p.createdAt),
        opportunityScore: score,
        source: 'indiehackers',
      };
    })
    .filter(p => p.opportunityScore >= 20)
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  return scored.slice(0, 5);
}

// Search IH milestones/posts for abandonment signals
export async function findAbandonmentPosts(term) {
  const abandonmentTerms = [
    `${term} abandoned`,
    `${term} stopped`,
    `${term} shut down`,
    `${term} no longer`,
  ];

  const posts = [];
  for (const q of abandonmentTerms) {
    const results = await searchIHPosts(q);
    posts.push(...results.map(p => ({
      title: p.title || p.subject,
      author: p.userId,
      url: p.url ? `https://www.indiehackers.com${p.url}` : null,
      date: p.createdAt,
      daysSince: daysSince(p.createdAt),
      source: 'indiehackers_post',
    })));
    await sleep(1000);
  }

  return posts.slice(0, 8);
}

export async function scanCategories(categories) {
  const results = {};
  for (const cat of categories) {
    results[cat] = await findAbandonedProducts(cat);
    await sleep(1500);
  }
  return results;
}
