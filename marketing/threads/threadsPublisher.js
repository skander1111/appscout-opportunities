#!/usr/bin/env node
/**
 * threadsPublisher.js
 * Publishes a drafted post to Threads via the official Meta Threads API.
 * THREADS_POSTING_ENABLED must be set to "true" in .env to actually post.
 *
 * Official API docs: https://developers.facebook.com/docs/threads
 *
 * Usage:
 *   node threadsPublisher.js --id <id> [--dry-run]
 *   node threadsPublisher.js --next [--dry-run]    ← publishes pending-post.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env if present
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach((line) => {
    const [k, v] = line.split('=');
    if (k && v !== undefined) process.env[k.trim()] = v.trim();
  });
}

const LANG = (process.argv.find((a, i) => process.argv[i - 1] === '--lang') || 'en').toLowerCase();
const IS_DE = LANG === 'de';

const ACCESS_TOKEN = IS_DE
  ? (process.env.THREADS_ACCESS_TOKEN_DE || '')
  : (process.env.THREADS_ACCESS_TOKEN || '');
const USER_ID = IS_DE
  ? (process.env.THREADS_USER_ID_DE || '')
  : (process.env.THREADS_USER_ID || '');
const POSTING_ENABLED = IS_DE
  ? process.env.THREADS_POSTING_ENABLED_DE === 'true'
  : process.env.THREADS_POSTING_ENABLED === 'true';

const LOG_FILE = path.join(__dirname, 'threads-log.json');
const DRAFTS_FILE = path.join(__dirname, 'threads-drafts.md');
const PENDING_FILE = IS_DE
  ? path.join(__dirname, 'pending-post-de.json')
  : path.join(__dirname, 'pending-post.json');

const DRY_RUN = process.argv.includes('--dry-run');
const NEXT_MODE = process.argv.includes('--next');
const idArg = process.argv.find((a, i) => process.argv[i - 1] === '--id');

const MAX_POSTS_PER_DAY = 1;

// ── Helpers ───────────────────────────────────────────────────────────

function loadLog() {
  if (!fs.existsSync(LOG_FILE)) return [];
  return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
}

function appendLog(entry) {
  const log = loadLog();
  log.push({ ...entry, timestamp: new Date().toISOString() });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
}

function postedTodayCount() {
  const log = loadLog();
  const today = new Date().toISOString().split('T')[0];
  return log.filter((e) => e.action === 'posted' && e.timestamp.startsWith(today)).length;
}

function apiPost(endpoint, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const options = {
      hostname: 'graph.threads.net',
      path: `/v1.0${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(`API error ${parsed.error.code}: ${parsed.error.message}`));
          else resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function updateDraftStatus(id, newStatus) {
  if (!fs.existsSync(DRAFTS_FILE)) return;
  let content = fs.readFileSync(DRAFTS_FILE, 'utf8');
  content = content.replace(
    new RegExp(`(\\*\\*ID:\\*\\* ${id}[\\s\\S]*?\\*\\*Status:\\*\\* )\\w+`),
    `$1${newStatus}`
  );
  fs.writeFileSync(DRAFTS_FILE, content, 'utf8');
}

function loadEntry(id) {
  const log = loadLog();
  return log.slice().reverse().find((e) => String(e.id) === String(id) && e.action === 'generated');
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📤 AppScout Threads Publisher`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Lang: ${LANG.toUpperCase()} account`);
  console.log(`Posting enabled: ${POSTING_ENABLED ? 'YES' : `NO (THREADS_POSTING_ENABLED${IS_DE ? '_DE' : ''}=false)`}\n`);

  // ── Load entry ──
  let entry;
  if (NEXT_MODE) {
    if (!fs.existsSync(PENDING_FILE)) {
      console.log(`No pending post found. Run generateThreadsPosts.js first.\n`);
      process.exit(0);
    }
    entry = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
  } else if (idArg) {
    entry = loadEntry(idArg);
    if (!entry) {
      console.log(`No generated entry found with id ${idArg}.\n`);
      process.exit(1);
    }
  } else {
    console.log(`Usage:`);
    console.log(`  node threadsPublisher.js --next [--dry-run]`);
    console.log(`  node threadsPublisher.js --id <id> [--dry-run]\n`);
    process.exit(0);
  }

  // ── Already posted? ──
  const alreadyPosted = loadLog().find((e) => e.action === 'posted' && String(e.id) === String(entry.id));
  if (alreadyPosted) {
    console.log(`⚠️  This post (id: ${entry.id}) was already published at ${alreadyPosted.timestamp}.\n`);
    process.exit(0);
  }

  // ── Daily limit ──
  const todayCount = postedTodayCount();
  if (todayCount >= MAX_POSTS_PER_DAY && !DRY_RUN) {
    console.log(`🛑 Already posted ${todayCount} time(s) today. Max is ${MAX_POSTS_PER_DAY}/day.\n`);
    process.exit(1);
  }

  // ── Show post ──
  console.log(`── Post Preview ─────────────────────────────────────`);
  console.log(`Type:    ${entry.postType}`);
  console.log(`Chars:   ${entry.text.length}/500`);
  console.log(`─────────────────────────────────────────────────────`);
  console.log(entry.text);
  console.log(`─────────────────────────────────────────────────────\n`);

  if (DRY_RUN) {
    console.log(`✓ Dry run complete. Nothing posted.\n`);
    return;
  }

  if (!POSTING_ENABLED) {
    console.log(`⚠️  THREADS_POSTING_ENABLED is false.`);
    console.log(`   Set it to true in .env when you're ready to go live.`);
    console.log(`   Post saved as draft only.\n`);
    appendLog({ action: 'skipped', id: entry.id, postType: entry.postType, reason: 'THREADS_POSTING_ENABLED=false' });
    return;
  }

  if (!ACCESS_TOKEN || !USER_ID) {
    console.log(`🛑 Missing credentials. Set THREADS_ACCESS_TOKEN and THREADS_USER_ID in .env\n`);
    process.exit(1);
  }

  try {
    // ── Step 1: Create media container ──
    console.log(`Creating media container...`);
    const container = await apiPost(`/${USER_ID}/threads`, {
      media_type: 'TEXT',
      text: entry.text,
      access_token: ACCESS_TOKEN,
    });
    console.log(`Container ID: ${container.id}`);

    // ── Brief pause (API recommendation) ──
    await new Promise((r) => setTimeout(r, 1000));

    // ── Step 2: Publish ──
    console.log(`Publishing...`);
    const published = await apiPost(`/${USER_ID}/threads/publish`, {
      creation_id: container.id,
      access_token: ACCESS_TOKEN,
    });

    console.log(`\n✅ Published! Thread ID: ${published.id}`);

    appendLog({
      action: 'posted',
      id: entry.id,
      postType: entry.postType,
      threadId: published.id,
      charCount: entry.text.length,
    });

    updateDraftStatus(entry.id, 'posted');

    // Clean up pending file
    if (fs.existsSync(PENDING_FILE)) fs.unlinkSync(PENDING_FILE);

    console.log(`   Logged to threads-log.json`);
    console.log(`   Done for today — come back tomorrow.\n`);

  } catch (err) {
    console.error(`\n🛑 API error: ${err.message}`);
    console.error(`   Stopping. Check your token and user ID.\n`);
    appendLog({ action: 'failed', id: entry.id, postType: entry.postType, error: err.message });
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
