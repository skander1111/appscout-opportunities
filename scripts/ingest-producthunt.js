// Pulls recent Product Hunt launches via OAuth (client_credentials) +
// GraphQL API v2, merges into web/data/signals.json with source: "producthunt".
//
// Env:
//   PRODUCTHUNT_API_KEY     · OAuth client_id
//   PRODUCTHUNT_API_SECRET  · OAuth client_secret
//
// API docs: https://api.producthunt.com/v2/docs/

import fs from 'fs';
import path from 'path';

const OUT = path.join('web', 'data', 'signals.json');
const CLIENT_ID = process.env.PRODUCTHUNT_API_KEY;
const CLIENT_SECRET = process.env.PRODUCTHUNT_API_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log('[ingest-producthunt] PRODUCTHUNT_API_KEY/SECRET not set — skipping');
  process.exit(0);
}

const TOKEN_URL = 'https://api.producthunt.com/v2/oauth/token';
const GQL_URL = 'https://api.producthunt.com/v2/api/graphql';

async function getToken() {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OAuth failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.access_token;
}

const POSTS_QUERY = `
  query RecentPosts($first: Int!) {
    posts(order: NEWEST, first: $first) {
      edges {
        node {
          id
          name
          tagline
          slug
          url
          website
          votesCount
          commentsCount
          createdAt
          topics(first: 3) { edges { node { name } } }
        }
      }
    }
  }
`;

async function fetchPosts(token) {
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'AppScout/1.0',
    },
    body: JSON.stringify({ query: POSTS_QUERY, variables: { first: 30 } }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GraphQL failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors).slice(0, 200)}`);
  }
  return data.data?.posts?.edges?.map((e) => e.node) ?? [];
}

function daysAgoOf(dateStr) {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function classify(post) {
  const t = `${post.name} ${post.tagline}`.toLowerCase();
  if (/\bacquir|\bbought\b/.test(t)) return 'acquire';
  if (/\bfor sale\b|\bselling\b/.test(t)) return 'sell';
  return 'trend';
}

async function main() {
  console.log('[ingest-producthunt] authenticating...');
  const token = await getToken();
  console.log('[ingest-producthunt] fetching recent posts...');
  const posts = await fetchPosts(token);
  console.log(`[ingest-producthunt] ${posts.length} posts`);

  const mapped = posts.map((p) => {
    const topic = p.topics?.edges?.[0]?.node?.name;
    return {
      id: `ph-${p.id}`,
      source: 'producthunt',
      outlet: 'Product Hunt',
      title: `${p.name} — ${p.tagline}`.slice(0, 240),
      url: p.url || `https://producthunt.com/posts/${p.slug}`,
      points: p.votesCount ?? 0,
      comments: p.commentsCount ?? 0,
      date: p.createdAt ? p.createdAt.slice(0, 10) : '',
      daysAgo: daysAgoOf(p.createdAt),
      classification: classify(p),
      summary: (p.tagline || '').slice(0, 280),
      niche: topic,
    };
  });

  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  const seen = new Set(existing.map((s) => s.id));
  const merged = [...existing];
  for (const it of mapped) {
    if (it.url && !seen.has(it.id)) {
      merged.push(it);
      seen.add(it.id);
    }
  }
  const trimmed = merged
    .filter((s) => (s.daysAgo ?? 0) <= 30)
    .sort((a, b) => (a.daysAgo ?? 0) - (b.daysAgo ?? 0))
    .slice(0, 200);

  fs.writeFileSync(OUT, JSON.stringify(trimmed, null, 2));
  console.log(`[ingest-producthunt] wrote ${trimmed.length} signals total → ${OUT}`);
}

main().catch((err) => {
  console.error('[ingest-producthunt] failed:', err.message);
  process.exit(1);
});
