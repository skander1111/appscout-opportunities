// Pulls posts from the AppScout Threads accounts (EN + optional DE) via the
// official Meta Threads API and merges them into web/data/signals.json with
// source: "threads". Falls back to a manual JSON file when no token is
// configured so a curator can paste in industry posts by hand.
//
// Env:
//   THREADS_ACCESS_TOKEN     · long-lived token for the EN account
//   THREADS_USER_ID          · numeric user id of the EN account
//   THREADS_ACCESS_TOKEN_DE  · (optional) long-lived token for the DE account
//   THREADS_USER_ID_DE       · (optional) numeric user id of the DE account
//
// API docs: https://developers.facebook.com/docs/threads/threads-media

import fs from 'fs';
import path from 'path';

const OUT = path.join('web', 'data', 'signals.json');
const MANUAL = path.join('web', 'data', 'manual-threads.json');

const ACCOUNTS = [
  { lang: 'en', token: process.env.THREADS_ACCESS_TOKEN,    userId: process.env.THREADS_USER_ID },
  { lang: 'de', token: process.env.THREADS_ACCESS_TOKEN_DE, userId: process.env.THREADS_USER_ID_DE },
].filter((a) => a.token && a.userId);

function daysAgoOf(dateStr) {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function classify(text = '') {
  const t = text.toLowerCase();
  if (/\bacquir|\bbought\b/.test(t)) return 'acquire';
  if (/\bfor sale|\bselling\b|\bshutting down\b/.test(t)) return 'sell';
  if (/\blaunch|\bbuild|\bindie\b|\brevenue\b/.test(t)) return 'trend';
  return 'discuss';
}

async function fetchAccount(acct) {
  const url =
    `https://graph.threads.net/v1.0/${encodeURIComponent(acct.userId)}/threads` +
    `?fields=id,permalink,text,timestamp,media_type` +
    `&limit=25` +
    `&access_token=${encodeURIComponent(acct.token)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'AppScout/1.0' } });
    if (!res.ok) {
      const body = await res.text();
      console.log(`  ✗ ${acct.lang} → HTTP ${res.status}: ${body.slice(0, 120)}`);
      return [];
    }
    const data = await res.json();
    const posts = Array.isArray(data.data) ? data.data : [];
    console.log(`  ✓ ${acct.lang} → ${posts.length} posts`);
    return posts.map((p) => ({ ...p, _lang: acct.lang }));
  } catch (err) {
    console.log(`  ✗ ${acct.lang} → ${err.message}`);
    return [];
  }
}

function readManual() {
  if (!fs.existsSync(MANUAL)) return [];
  try {
    return JSON.parse(fs.readFileSync(MANUAL, 'utf8'));
  } catch {
    return [];
  }
}

async function main() {
  let raw = [];

  if (ACCOUNTS.length === 0) {
    console.log('[ingest-threads] no THREADS_ACCESS_TOKEN configured — using manual file only');
  } else {
    console.log(`[ingest-threads] fetching ${ACCOUNTS.length} account(s) from Threads API...`);
    for (const acct of ACCOUNTS) {
      const posts = await fetchAccount(acct);
      raw.push(...posts);
    }
  }

  // Always also fold in manual entries (curated industry posts).
  const manual = readManual();
  if (manual.length) console.log(`[ingest-threads] + ${manual.length} manual entries`);

  const fromApi = raw.map((p) => {
    const text = p.text || '';
    const isoDate = p.timestamp ? new Date(p.timestamp).toISOString().slice(0, 10) : '';
    return {
      id: `th-${p.id}`,
      source: 'threads',
      outlet: `@appscout_${p._lang}`,
      title: text.slice(0, 240) || '(media-only post)',
      url: p.permalink,
      points: 0,
      comments: 0,
      date: isoDate,
      daysAgo: daysAgoOf(p.timestamp),
      classification: classify(text),
      summary: text.slice(0, 280),
      niche: undefined,
    };
  });

  const fromManual = manual.map((m, i) => {
    const idBase = (m.url || m.title || `manual-${i}`).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 80);
    return {
      id: `th-${idBase}`,
      source: 'threads',
      outlet: m.author || 'Threads',
      title: (m.title || m.text || '').slice(0, 240),
      url: m.url,
      points: m.points ?? 0,
      comments: m.comments ?? 0,
      date: m.date || '',
      daysAgo: m.daysAgo ?? daysAgoOf(m.date),
      classification: m.classification || classify(m.title || m.text || ''),
      summary: (m.summary || m.text || m.title || '').slice(0, 280),
      niche: m.niche,
    };
  });

  const merged = [...(fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [])];
  const seen = new Set(merged.map((s) => s.id));
  for (const it of [...fromApi, ...fromManual]) {
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
  console.log(`[ingest-threads] wrote ${trimmed.length} signals total → ${OUT}`);
}

main().catch((err) => {
  console.error('[ingest-threads] failed:', err);
  process.exit(1);
});
