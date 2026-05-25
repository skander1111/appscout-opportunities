// Pulls tech magazine RSS feeds, filters for entrepreneurship / app-business
// signals, and merges into web/data/signals.json with source: "news".

import fs from 'fs';
import path from 'path';

const OUT = path.join('web', 'data', 'signals.json');

const FEEDS = [
  { name: 'TechCrunch',    source: 'techcrunch',    url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge',     source: 'theverge',      url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Wired',         source: 'wired',         url: 'https://www.wired.com/feed/rss' },
  { name: 'HN Frontpage',  source: 'hackernews',    url: 'https://hnrss.org/frontpage' },
  { name: 'Indie Hackers', source: 'indiehackers',  url: 'https://www.indiehackers.com/feed.xml' },
];

// Keep entries whose title/summary suggest a deal, acquisition, abandoned app,
// solo-dev exit, or revenue milestone. Drop pure news/gadget reviews.
const RELEVANT = /\b(acquir|acquisition|sold|bought|exit|abandoned|shutdown|shutting down|sunset|deprecat|indie|solo dev|bootstrap|side project|app store|play store|saas|launched|launch|kickstart|revenue|mrr|arr|monetiz|paywall|subscription|gumroad)/i;

function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function pick(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

function pickLink(xml) {
  // Atom <link href="..."/> or RSS <link>...</link>
  const atom = xml.match(/<link[^>]*href="([^"]+)"/i);
  if (atom) return atom[1];
  return pick(xml, 'link');
}

function parseFeed(xml) {
  const items = [];
  const isAtom = /<feed[\s>]/i.test(xml);
  const blockRe = isAtom
    ? /<entry\b[\s\S]*?<\/entry>/gi
    : /<item\b[\s\S]*?<\/item>/gi;
  const blocks = xml.match(blockRe) || [];
  for (const b of blocks) {
    const title = pick(b, 'title');
    const link = pickLink(b);
    const date = pick(b, isAtom ? 'updated' : 'pubDate') || pick(b, 'published');
    const summary =
      pick(b, 'description') ||
      pick(b, 'summary') ||
      pick(b, 'content:encoded') ||
      pick(b, 'content');
    items.push({ title, link, date, summary });
  }
  return items;
}

function daysAgo(dateStr) {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function classify(text) {
  const t = text.toLowerCase();
  if (/\bacquir|\bbought|\bsold\b|\bexit\b/.test(t)) return 'acquire';
  if (/\bfor sale|\bselling|\bshutting down|\bsunset|\babandon/.test(t)) return 'sell';
  if (/\blaunch|\brevenue|\bmrr\b|\barr\b|\bindie\b|\bbootstrap/.test(t)) return 'trend';
  return 'discuss';
}

function nicheGuess(text) {
  const t = text.toLowerCase();
  if (/ai|llm|gpt|claude|gemini/.test(t)) return 'AI';
  if (/saas/.test(t)) return 'SaaS';
  if (/mobile|ios|android|app/.test(t)) return 'Mobile';
  if (/chrome extension|browser extension/.test(t)) return 'Extensions';
  if (/newsletter|substack/.test(t)) return 'Newsletters';
  return undefined;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'AppScout/1.0 (+https://appscout-ai.vercel.app)' },
    });
    if (!res.ok) {
      console.log(`  [skip] ${feed.name} → HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    return parseFeed(xml).map((it) => ({ ...it, feed }));
  } catch (err) {
    console.log(`  [skip] ${feed.name} → ${err.message}`);
    return [];
  }
}

async function main() {
  console.log('[ingest-news] fetching RSS feeds...');
  const all = (await Promise.all(FEEDS.map(fetchFeed))).flat();
  console.log(`[ingest-news] ${all.length} items total`);

  const relevant = all.filter((it) => {
    const blob = `${it.title}\n${it.summary}`;
    return RELEVANT.test(blob);
  });
  console.log(`[ingest-news] ${relevant.length} relevant after keyword filter`);

  const newItems = relevant.map((it) => {
    const ageDays = daysAgo(it.date);
    const isoDate = it.date ? new Date(it.date).toISOString().slice(0, 10) : '';
    const idBase = (it.link || it.title).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 80);
    return {
      id: `news-${it.feed.source}-${idBase}`,
      source: it.feed.source === 'hackernews' || it.feed.source === 'indiehackers' ? it.feed.source : 'news',
      outlet: it.feed.name,
      title: it.title.slice(0, 240),
      url: it.link,
      points: 0,
      comments: 0,
      date: isoDate,
      daysAgo: ageDays,
      classification: classify(`${it.title} ${it.summary}`),
      summary: it.summary.slice(0, 280),
      niche: nicheGuess(`${it.title} ${it.summary}`),
    };
  });

  // Merge into existing signals.json, dedupe by id, drop items older than 30 days,
  // keep at most 200 entries (newest first).
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  const seen = new Set(existing.map((s) => s.id));
  const merged = [...existing];
  for (const it of newItems) {
    if (!seen.has(it.id)) {
      merged.push(it);
      seen.add(it.id);
    }
  }
  const trimmed = merged
    .filter((s) => (s.daysAgo ?? 0) <= 30)
    .sort((a, b) => (a.daysAgo ?? 0) - (b.daysAgo ?? 0))
    .slice(0, 200);

  fs.writeFileSync(OUT, JSON.stringify(trimmed, null, 2));
  const added = trimmed.length - existing.length;
  console.log(`[ingest-news] wrote ${trimmed.length} signals (${added >= 0 ? '+' + added : added}) → ${OUT}`);
}

main().catch((err) => {
  console.error('[ingest-news] failed:', err);
  process.exit(1);
});
