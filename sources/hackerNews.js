// Hacker News — Algolia public search API (no auth required)
// Best for: Show HN posts about apps that got traction then went quiet

const ALGOLIA = 'https://hn.algolia.com/api/v1';
const HEADERS = { 'User-Agent': 'AppScout/1.0' };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr)) / 86_400_000);
}

function scoreHNPost(post, days) {
  let score = 0;

  // Points = proxy for demand
  if (post.points >= 300) score += 35;
  else if (post.points >= 100) score += 25;
  else if (post.points >= 50) score += 18;
  else if (post.points >= 20) score += 10;
  else return 0;

  // Age = abandonment signal
  if (days >= 365 * 3) score += 30;
  else if (days >= 365 * 2) score += 22;
  else if (days >= 365) score += 14;
  else if (days >= 180) score += 6;
  else return 0;

  // Comments = community engagement
  if (post.num_comments >= 100) score += 15;
  else if (post.num_comments >= 50) score += 10;
  else if (post.num_comments >= 20) score += 5;

  // Mobile/app signal in title
  const title = post.title.toLowerCase();
  if (/android|ios|mobile|flutter|react native/i.test(title)) score += 10;
  if (/open.?source|mit license|free to use|github/i.test(title)) score += 5;

  return Math.min(100, score);
}

async function search(query, tags = 'show_hn', hitsPerPage = 10) {
  const url = `${ALGOLIA}/search?query=${encodeURIComponent(query)}&tags=${tags}&hitsPerPage=${hitsPerPage}&attributesToRetrieve=objectID,title,url,points,num_comments,created_at,author`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return data.hits || [];
  } catch {
    return [];
  }
}

export async function findAbandonedShowHN(term) {
  const queries = [
    term,
    `${term} app`,
    `${term} android`,
    `${term} mobile`,
  ];

  const seen = new Set();
  const results = [];

  for (const q of queries) {
    const hits = await search(q, 'show_hn');
    for (const hit of hits) {
      if (seen.has(hit.objectID)) continue;
      seen.add(hit.objectID);

      const days = daysSince(hit.created_at);
      const score = scoreHNPost(hit, days);
      if (score < 25) continue;

      results.push({
        title: hit.title,
        author: hit.author,
        points: hit.points,
        comments: hit.num_comments,
        postedDate: hit.created_at?.split('T')[0],
        daysSincePost: days,
        url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        externalUrl: hit.url || null,
        opportunityScore: score,
        type: 'show_hn',
      });
    }
    await sleep(500);
  }

  results.sort((a, b) => b.opportunityScore - a.opportunityScore);
  return results.slice(0, 5);
}

// Search all HN (not just Show HN) for acquisition/builder discussions
export async function findAcquisitionDiscussions(term) {
  const queries = [
    `${term} app acquisition`,
    `${term} android acquired`,
    `${term} app "for sale"`,
    `${term} "side project" android`,
  ];

  const seen = new Set();
  const posts = [];

  for (const q of queries) {
    const hits = await search(q, 'story', 8);
    for (const hit of hits) {
      if (seen.has(hit.objectID)) continue;
      seen.add(hit.objectID);

      const days = daysSince(hit.created_at);
      if (days < 180 || hit.points < 10) continue;

      posts.push({
        title: hit.title,
        author: hit.author,
        points: hit.points,
        comments: hit.num_comments,
        postedDate: hit.created_at?.split('T')[0],
        daysSincePost: days,
        url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        type: 'discussion',
      });
    }
    await sleep(500);
  }

  return posts.sort((a, b) => b.points - a.points).slice(0, 5);
}

// Broad scan: find high-scoring Show HN app posts older than 1 year with no follow-up
export async function scanAbandonedApps(categories) {
  const allResults = [];

  for (const cat of categories) {
    const results = await findAbandonedShowHN(cat);
    allResults.push(...results.map(r => ({ ...r, category: cat })));
    await sleep(1000);
  }

  return allResults.sort((a, b) => b.opportunityScore - a.opportunityScore);
}
