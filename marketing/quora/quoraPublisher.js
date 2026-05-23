#!/usr/bin/env node
/**
 * quoraPublisher.js
 *
 * Manages the posting workflow. Does NOT automate browser actions,
 * does NOT bypass login, captchas, or rate limits.
 *
 * What it does:
 * - Enforces 1-post-per-day limit
 * - Confirms the answer meets quality threshold
 * - Copies answer to clipboard (you paste + submit manually)
 * - Logs the post once you confirm it's done
 *
 * Usage:
 *   node quoraPublisher.js --id <answer-id> [--dry-run] [--confirm]
 *   node quoraPublisher.js --next [--dry-run]     ← picks next approved answer
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { QUALITY_MIN } = require('./scoreAnswer');

const QUEUE_FILE = path.join(__dirname, 'postQueue.json');
const LOG_FILE = path.join(__dirname, 'quora-log.json');
const DRAFTS_FILE = path.join(__dirname, 'quora-drafts.md');

const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRM = process.argv.includes('--confirm');
const NEXT_MODE = process.argv.includes('--next');
const idArg = process.argv.find((a, i) => process.argv[i - 1] === '--id');

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
}

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

function copyToClipboard(text) {
  try {
    // Windows
    execSync('clip', { input: text });
    return true;
  } catch {
    try {
      // macOS
      execSync('pbcopy', { input: text });
      return true;
    } catch {
      return false;
    }
  }
}

function updateQueueStatus(id, status, extra = {}) {
  const queue = loadQueue();
  const idx = queue.findIndex((q) => q.id === id);
  if (idx === -1) return;
  queue[idx] = { ...queue[idx], status, ...extra };
  saveQueue(queue);
}

function updateDraftStatus(question, newStatus) {
  if (!fs.existsSync(DRAFTS_FILE)) return;
  let content = fs.readFileSync(DRAFTS_FILE, 'utf8');
  content = content.replace(
    new RegExp(`(## ${question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?\\*\\*Status:\\*\\* )\\w+`),
    `$1${newStatus}`
  );
  fs.writeFileSync(DRAFTS_FILE, content, 'utf8');
}

function main() {
  console.log(`\n📤 AppScout Quora Publisher`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (nothing will be posted)' : 'LIVE'}`);
  console.log(`─────────────────────────────────\n`);

  // ── Daily limit check ──
  const todayCount = postedTodayCount();
  if (todayCount >= 1 && !DRY_RUN) {
    console.log(`🛑 STOP: Already posted ${todayCount} answer(s) today.`);
    console.log(`   Maximum is 1 per day. Come back tomorrow.\n`);
    process.exit(1);
  }

  const queue = loadQueue();
  let answer;

  if (NEXT_MODE) {
    answer = queue.find((q) => q.status === 'approved');
    if (!answer) {
      console.log(`No approved answers in queue.`);
      console.log(`Run generateAnswers.js to add more, or manually change status to "approved" in postQueue.json.\n`);
      process.exit(0);
    }
  } else if (idArg) {
    answer = queue.find((q) => String(q.id) === String(idArg));
    if (!answer) {
      console.log(`Answer with id ${idArg} not found in queue.\n`);
      process.exit(1);
    }
  } else {
    console.log(`Usage:`);
    console.log(`  node quoraPublisher.js --next [--dry-run]`);
    console.log(`  node quoraPublisher.js --id <id> [--dry-run] [--confirm]\n`);
    process.exit(0);
  }

  // ── Quality gate ──
  if (answer.scores.quality < QUALITY_MIN) {
    console.log(`🛑 STOP: Quality score ${answer.scores.quality} is below minimum ${QUALITY_MIN}.`);
    console.log(`   Edit the answer in quora-drafts.md, update postQueue.json, then re-run.\n`);
    updateQueueStatus(answer.id, 'skipped', { reason: `Quality score ${answer.scores.quality} below threshold` });
    appendLog({ action: 'skipped', id: answer.id, question: answer.question, reason: `quality ${answer.scores.quality} < ${QUALITY_MIN}` });
    process.exit(1);
  }

  // ── Risk gate ──
  if (answer.scores.risk > 40) {
    console.log(`⚠️  WARNING: Risk score ${answer.scores.risk}/100 is high.`);
    if (!DRY_RUN && !CONFIRM) {
      console.log(`   Run with --confirm to proceed anyway, or fix the answer.\n`);
      process.exit(1);
    }
  }

  // ── Status check ──
  if (answer.status === 'posted') {
    console.log(`⚠️  This answer is already marked as posted. Skipping.\n`);
    process.exit(0);
  }

  if (answer.status === 'failed') {
    console.log(`⚠️  This answer was previously marked as failed.`);
    console.log(`   Review and change status to "approved" in postQueue.json to retry.\n`);
    process.exit(1);
  }

  // ── Show the answer ──
  console.log(`📋 Answer ready to post:`);
  console.log(`─────────────────────────────────`);
  console.log(`Question: ${answer.question}`);
  if (answer.url) console.log(`URL:      ${answer.url}`);
  console.log(`Scores:   Relevance ${answer.scores.relevance} · Quality ${answer.scores.quality} · Risk ${answer.scores.risk}`);
  console.log(`CTA:      ${answer.ctaType}`);
  console.log(`─────────────────────────────────\n`);
  console.log(answer.body);
  console.log(`\n─────────────────────────────────`);

  if (DRY_RUN) {
    console.log(`\n✓ Dry run complete. No changes made.\n`);
    return;
  }

  // ── Copy to clipboard ──
  const copied = copyToClipboard(answer.body);
  if (copied) {
    console.log(`\n✓ Answer copied to clipboard.`);
  } else {
    console.log(`\n⚠️  Could not copy to clipboard. Copy the answer above manually.`);
  }

  if (answer.url) {
    console.log(`\n👉 Steps:`);
    console.log(`   1. Open: ${answer.url}`);
    console.log(`   2. Click "Answer"`);
    console.log(`   3. Paste from clipboard (Ctrl+V)`);
    console.log(`   4. Review and submit`);
    console.log(`   5. Run this command to mark as posted:`);
    console.log(`      node quoraPublisher.js --id ${answer.id} --confirm\n`);
  }

  if (CONFIRM) {
    updateQueueStatus(answer.id, 'posted', { postedAt: new Date().toISOString() });
    updateDraftStatus(answer.question, 'posted');
    appendLog({ action: 'posted', id: answer.id, question: answer.question, url: answer.url, ctaType: answer.ctaType });
    console.log(`\n✅ Marked as posted. Done for today — come back tomorrow.\n`);
  } else {
    console.log(`After you post, run with --confirm to log it:\n  node quoraPublisher.js --id ${answer.id} --confirm\n`);
  }
}

main();
