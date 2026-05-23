#!/usr/bin/env node
/**
 * generateAnswers.js
 * Generates a high-quality Quora answer draft for a given question.
 * Pulls live data from AppScout API for real examples.
 * Saves to postQueue.json and quora-drafts.md.
 *
 * Usage:
 *   node generateAnswers.js --question "How do I find apps to acquire?" --url "https://quora.com/..." [--dry-run]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { scoreAnswer } = require('./scoreAnswer');

const QUEUE_FILE = path.join(__dirname, 'postQueue.json');
const DRAFTS_FILE = path.join(__dirname, 'quora-drafts.md');
const LOG_FILE = path.join(__dirname, 'quora-log.json');
const API_BASE = 'https://appscout-ai.vercel.app';

const DRY_RUN = process.argv.includes('--dry-run');
const questionArg = process.argv.find((a, i) => process.argv[i - 1] === '--question');
const urlArg = process.argv.find((a, i) => process.argv[i - 1] === '--url');

// ── Link budget enforcement (60% no link, 40% max with link) ──────────
function decideCTA() {
  const queue = loadQueue();
  const posted = queue.filter((q) => q.status === 'posted');
  const withLink = posted.filter((q) => q.ctaType !== 'none').length;
  const ratio = posted.length > 0 ? withLink / posted.length : 0;
  // Only include link if under 40% threshold
  return ratio < 0.4 ? 'soft' : 'none';
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
}

function appendLog(entry) {
  let log = [];
  if (fs.existsSync(LOG_FILE)) log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  log.push({ ...entry, timestamp: new Date().toISOString() });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
}

function fetchTopApps() {
  return new Promise((resolve) => {
    https.get(`${API_BASE}/api/opportunities?limit=5`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const apps = JSON.parse(data);
          resolve(Array.isArray(apps) ? apps.slice(0, 3) : []);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

function formatInstalls(n) {
  if (!n) return 'hundreds of thousands of';
  if (n >= 10_000_000) return 'over 10 million';
  if (n >= 5_000_000) return 'over 5 million';
  if (n >= 1_000_000) return 'over 1 million';
  if (n >= 500_000) return 'over 500,000';
  return 'over 100,000';
}

// ── Answer templates by topic ─────────────────────────────────────────
function buildAnswer(question, apps, ctaType) {
  const q = question.toLowerCase();
  const appExample = apps[0];
  const exampleLine = appExample
    ? `For example, right now there's a ${appExample.niche || 'fitness'} app with ${formatInstalls(appExample.installs)} installs that hasn't been updated in over ${Math.floor((appExample.daysSinceUpdate || 400) / 30)} months. The developer's email is public.`
    : `For example, right now there are apps with millions of installs that haven't been updated in over a year. The developers' emails are public.`;

  const ctaLine = ctaType === 'soft'
    ? `\n\nI built a tool called AppScout that automates this scan across 19+ niches — it surfaces scored opportunities weekly with developer contact included. Worth a look if you don't want to do the manual scouting: appscout-ai.vercel.app`
    : '';

  // ── Acquisition / finding apps ──
  if (q.includes('find') || q.includes('discover') || q.includes('look for')) {
    return `The best app acquisitions happen before the seller knows they want to sell.

Here's the playbook most people miss:

**Search for abandonment, not listings**
Go to Google Play or the App Store. Pick a niche you understand — calculators, timers, habit trackers, whatever. Sort by last updated. Any app with 100k+ installs that hasn't been touched in 12+ months is a signal.

**Check who owns it**
Indie developers almost always list a contact email on the store page. One person, no team, no corporate owner — that's your target. They're motivated to talk.

**${exampleLine}**

**Email them first**
Don't lead with "I want to buy your app." Lead with curiosity: "I noticed your app still has a strong user base — would you be open to a conversation about its future?" Low pressure. High response rate.

**Why this works**
Most developers who abandoned an app didn't fail — they got a job, had a kid, started something new. The app still runs, still ranks, still gets installs. They just stopped caring. You're not buying a failure, you're buying an orphan.${ctaLine}`;
  }

  // ── Flippa alternative ──
  if (q.includes('flippa') || q.includes('marketplace') || q.includes('alternative')) {
    return `Flippa is fine, but by the time something lists there, you're competing against everyone else — and the seller knows their leverage.

The better move is finding apps before they list anywhere.

**What to look for:**
- Apps with 100k–10M installs
- Last updated 12–36 months ago
- Owned by a solo indie developer (not a company)
- Developer has a public email on the store page

These exist by the hundreds. Most have never received a single acquisition inquiry.

**${exampleLine}**

**Other off-market sources:**
- Reddit — r/androiddev, r/iOSProgramming. Search "looking to sell" — you'll find developers who posted with zero replies. That's a warm lead with no competition.
- GitHub — abandoned repos with real download history. Sometimes the developer links their app to a repo you can find.
- App store reviews — 1-star complaints about broken features on a well-installed app is a signal the dev has checked out.

The advantage isn't just price. It's that you can negotiate directly, move fast, and structure deals Flippa doesn't allow (revenue share, earnout, staged payment).${ctaLine}`;
  }

  // ── Micro-acquisition / buying small apps ──
  if (q.includes('micro') || q.includes('small') || q.includes('cheap') || q.includes('budget')) {
    return `Micro-acquisitions in the app space are one of the most underrated opportunities right now. Here's why, and how to approach them.

**Why apps specifically:**
Most apps that get abandoned were built by solo developers who spent 6–18 months getting to product-market fit — then life happened. The app still has installs, still gets organic traffic, still generates some revenue. But nobody's maintaining it.

**What "cheap" actually looks like:**
- Apps under 100k installs: often $500–5k direct to developer
- Apps with 100k–1M installs: $2k–50k depending on monetization
- Apps with 1M+ installs but broken: negotiating room because Flippa would price them higher

**The signal to look for:**
An app with a 3.5-star rating and hundreds of reviews saying "this used to be great but it crashes now" is a rebuild opportunity. The demand is proven. The execution broke. That gap is where the value is.

**${exampleLine}**

**How to approach:**
1. Find the developer email on the store page
2. Email: short, genuine, no pressure
3. If they're open, ask for 30-day revenue numbers via screenshot
4. Offer a simple structure: upfront payment, or upfront + revenue share${ctaLine}`;
  }

  // ── General / default ──
  return `This is a question more people should be asking.

The app acquisition market has a massive blind spot: the off-market. Apps that haven't been listed anywhere, that the developer hasn't even thought about selling — but would if someone reached out.

**The signals to find them:**
- 100k+ installs (proven demand exists)
- Last updated 12+ months ago (developer has moved on)
- Solo indie owner (one person, motivated, no corporate decision-making)
- Public email (you can actually reach them)

**${exampleLine}**

**Three plays once you find one:**

🎯 **Acquire** — Developer is fully gone, app is on autopilot. Buy it outright. Negotiate directly, skip the marketplace premium.

🔨 **Rebuild** — App has demand but poor execution (crashes, outdated UI, no updates). Build a better version, capture the same audience.

🤝 **Partner** — Developer is struggling but active. Propose revenue share, technical help, or co-ownership.

The key in all three is moving before anyone else does. Once it's on Flippa or Acquire.com, you've lost the edge.${ctaLine}`;
}

async function main() {
  if (!questionArg) {
    console.log('\nUsage: node generateAnswers.js --question "Your question here" --url "https://quora.com/..." [--dry-run]\n');
    console.log('Example:');
    console.log('  node generateAnswers.js --question "How do I find mobile apps to acquire without using Flippa?" --url "https://www.quora.com/..." --dry-run\n');
    process.exit(0);
  }

  console.log(`\n✍️  AppScout Quora Answer Generator`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Question: ${questionArg}\n`);

  const queue = loadQueue();
  const alreadyExists = queue.find((q) => q.question === questionArg);
  if (alreadyExists) {
    console.log(`⚠️  This question is already in the queue (status: ${alreadyExists.status}). Skipping.`);
    process.exit(0);
  }

  console.log('Fetching live app data...');
  const apps = await fetchTopApps();
  console.log(`Got ${apps.length} live examples.\n`);

  const ctaType = decideCTA();
  console.log(`CTA decision: ${ctaType} (link budget rule applied)\n`);

  const body = buildAnswer(questionArg, apps, ctaType);
  const scored = scoreAnswer({ question: questionArg, body, ctaType });

  console.log(`📊 Scores:`);
  console.log(`  Relevance: ${scored.scores.relevance}/100`);
  console.log(`  Quality:   ${scored.scores.quality}/100`);
  console.log(`  Risk:      ${scored.scores.risk}/100`);
  console.log(`  Status:    ${scored.status}`);
  if (scored.flags.length) {
    console.log(`  Flags:`);
    scored.flags.forEach((f) => console.log(`    ⚠️  ${f}`));
  }

  const entry = {
    id: Date.now(),
    question: questionArg,
    url: urlArg || null,
    body,
    ctaType,
    scores: scored.scores,
    status: scored.status,
    reason: scored.reason,
    generatedAt: new Date().toISOString(),
    postedAt: null,
  };

  if (DRY_RUN) {
    console.log('\n── DRY RUN: Answer Preview ──────────────────────\n');
    console.log(body);
    console.log('\n─────────────────────────────────────────────────');
    console.log('No files written in dry-run mode.\n');
    return;
  }

  // Save to queue
  queue.push(entry);
  saveQueue(queue);

  // Append to drafts markdown
  const draftEntry = `
---

## ${entry.question}

**URL:** ${entry.url || '_not set_'}
**Status:** ${entry.status}
**Scores:** Relevance ${entry.scores.relevance} · Quality ${entry.scores.quality} · Risk ${entry.scores.risk}
**CTA:** ${entry.ctaType}
**Generated:** ${entry.generatedAt}

${entry.body}

`;
  fs.appendFileSync(DRAFTS_FILE, draftEntry, 'utf8');

  appendLog({
    action: 'generated',
    question: questionArg,
    status: entry.status,
    scores: scored.scores,
  });

  console.log(`\n✓ Saved to queue (status: ${entry.status})`);
  console.log(`✓ Appended to quora-drafts.md`);
  if (entry.status === 'approved') {
    console.log(`\n→ Ready to post. Run: node quoraPublisher.js --id ${entry.id}`);
  } else {
    console.log(`\n→ Saved as draft. Review quora-drafts.md and edit before posting.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
