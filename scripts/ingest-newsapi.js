// Pulls tech-business signals from NewsAPI.org and merges into
// web/data/signals.json with source: "news".
//
// Env: NEWS_API_KEY (https://newsapi.org)
// Free dev tier: 100 req/day. We use 2 requests max per weekly run.

import fs from 'fs';
import path from 'path';

const OUT = path.join('web', 'data', 'signals.json');
const KEY = process.env.NEWS_API_KEY;

if (!KEY) {
  console.log('[ingest-newsapi] NEWS_API_KEY not set — skipping');
  process.exit(0);
}

// Curated source list: tech outlets that actually cover indie / acquisition / app news.
const SOURCES = [
  'techcrunch',
  'the-verge',
  'wired',
  'ars-technica',
  'engadget',
  'the-next-web',
  'recode',
  'hacker-news',
].join(',');

// Pull stories likely to surface a deal, exit, indie launch, or acquisition.
const QUERY = '(acquired OR "acquisition" OR exit OR "shutting down" OR "sunsetting" OR "for sale" OR indie OR bootstrap OR "side project" OR "abandoned app" OR "solo dev")';

async function fetchEverything() {
  const params = new URLSearchParams({
    q: QUERY,
    sources: SOURCES,
    language: 'en',
    sortBy: 'publishedAt',
    pageSize: '40',
  });
  const url = `https://newsapi.org/v2/everything?${params}`;
  const res = await fetch(url, { headers: { 'X-Api-Key': KEY, 'User-Agent': 'AppScout/1.0' } });
  if (!res.ok) {
    const body = await res.text();
    console.log(`[ingest-newsapi] HTTP ${res.status}: ${body.slice(0, 200)}`);
    return [];
  }
  const data = await res.json();
  if (data.status !== 'ok') {
    console.log(`[ingest-newsapi] API error: ${data.message}`);
    return [];
  }
  return data.articles ?? [];
}

function daysAgoOf(dateStr) {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function classify(text) {
  const t = (text || '').toLowerCase();
  if (/\bacquir|\bbought\b|\bsold\b|\bexit\b/.test(t)) return 'acquire';
  if (/\bfor sale\b|\bselling\b|\bshut(ting)? down\b|\bsunset/.test(t)) return 'sell';
  if (/\blaunch|\brevenue\b|\bmrr\b|\barr\b|\bindie\b|\bbootstrap/.test(t)) return 'trend';
  return 'discuss';
}

function nicheGuess(text) {
  const t = (text || '').toLowerCase();
  if (/\bai\b|\bllm\b|gpt|claude|gemini/.test(t)) return 'AI';
  if (/\bsaas\b/.test(t)) return 'SaaS';
  if (/\bmobile\b|\bios\b|\bandroid\b|\bapp\b/.test(t)) return 'Mobile';
  if (/chrome extension|browser extension/.test(t)) return 'Extensions';
  if (/newsletter|substack/.test(t)) return 'Newsletters';
  return undefined;
}

async function main() {
  console.log('[ingest-newsapi] fetching articles...');
  const articles = await fetchEverything();
  console.log(`[ingest-newsapi] ${articles.length} articles from NewsAPI`);

  const mapped = articles.map((a) => {
    const idBase = (a.url || a.title || '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 80);
    return {
      id: `news-${a.source?.id || 'newsapi'}-${idBase}`,
      source: 'news',
      outlet: a.source?.name || 'News',
      title: (a.title || '').slice(0, 240),
      url: a.url,
      points: 0,
      comments: 0,
      date: a.publishedAt ? a.publishedAt.slice(0, 10) : '',
      daysAgo: daysAgoOf(a.publishedAt),
      classification: classify(`${a.title} ${a.description}`),
      summary: (a.description || '').slice(0, 280),
      niche: nicheGuess(`${a.title} ${a.description}`),
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
  console.log(`[ingest-newsapi] wrote ${trimmed.length} signals total → ${OUT}`);
}

main().catch((err) => {
  console.error('[ingest-newsapi] failed:', err);
  process.exit(1);
});
