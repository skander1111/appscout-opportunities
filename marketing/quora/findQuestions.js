#!/usr/bin/env node
/**
 * findQuestions.js
 * Outputs Quora search queries for relevant topics.
 * Does NOT scrape Quora, bypass login, or touch anti-bot systems.
 * Use the queries manually in your browser to find questions to answer.
 */

const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, 'postQueue.json');

// Topics AppScout is genuinely positioned to help with
const TOPICS = [
  {
    category: 'App Acquisition',
    queries: [
      'site:quora.com "how to buy a mobile app"',
      'site:quora.com "how to acquire an app"',
      'site:quora.com "buying mobile apps" acquisition',
      'site:quora.com "app acquisition" indie developer',
    ],
  },
  {
    category: 'Abandoned Apps',
    queries: [
      'site:quora.com "abandoned app" "still getting downloads"',
      'site:quora.com "app not updated" acquire buy',
      'site:quora.com "inactive app" "google play" buy',
    ],
  },
  {
    category: 'Micro-Acquisitions',
    queries: [
      'site:quora.com "micro acquisition" mobile app',
      'site:quora.com "buy small app" indie developer',
      'site:quora.com "app business" under 10000 buy',
    ],
  },
  {
    category: 'Flippa Alternatives',
    queries: [
      'site:quora.com "flippa alternative" mobile app',
      'site:quora.com "where to buy apps" besides flippa',
      'site:quora.com "app marketplace" alternative flippa',
    ],
  },
  {
    category: 'Startup Opportunities',
    queries: [
      'site:quora.com "buy existing app" instead of building',
      'site:quora.com "rebuild existing app" opportunity',
      'site:quora.com "app with installs" buy developer',
    ],
  },
];

// Questions that are too risky or unrelated — never answer these
const BLACKLIST_PATTERNS = [
  'crack', 'hack', 'pirate', 'steal', 'bypass', 'scrape',
  'competitor', 'spam', 'fake review', 'bot',
];

function isBlacklisted(query) {
  return BLACKLIST_PATTERNS.some((p) => query.toLowerCase().includes(p));
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
}

function alreadyQueued(query) {
  const queue = loadQueue();
  return queue.some((item) => item.searchQuery === query);
}

const DRY_RUN = process.argv.includes('--dry-run');

console.log(`\n🔍 AppScout Quora Question Finder`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
console.log(`─────────────────────────────────\n`);
console.log(`These are Google search queries to find relevant Quora questions.`);
console.log(`Paste each into Google, open the Quora results, and find questions`);
console.log(`worth answering. Then run generateAnswers.js with the question URL.\n`);

let totalQueries = 0;

TOPICS.forEach(({ category, queries }) => {
  console.log(`\n📂 ${category}`);
  queries.forEach((query) => {
    if (isBlacklisted(query)) {
      console.log(`  ⛔ SKIPPED (blacklisted): ${query}`);
      return;
    }
    if (alreadyQueued(query)) {
      console.log(`  ✓ Already in queue: ${query}`);
      return;
    }
    console.log(`  → ${query}`);
    totalQueries++;
  });
});

console.log(`\n─────────────────────────────────`);
console.log(`${totalQueries} new queries to explore.`);
console.log(`\nNext step: open these in Google, find a relevant Quora question,`);
console.log(`then run: node generateAnswers.js --url "<quora-url>" --question "<question title>"\n`);
