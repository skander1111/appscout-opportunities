#!/usr/bin/env node
/**
 * dailyRun.js
 * Runs every morning via Task Scheduler.
 * Picks the next unanswered question from the bank, generates + scores the answer,
 * saves it to postQueue.json and quora-drafts.md.
 * You just open quora-drafts.md, paste the answer on Quora, done.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { QUESTION_BANK } = require('./questionBank');
const { scoreAnswer, QUALITY_MIN } = require('./scoreAnswer');

const QUEUE_FILE = path.join(__dirname, 'postQueue.json');
const DRAFTS_FILE = path.join(__dirname, 'quora-drafts.md');
const LOG_FILE = path.join(__dirname, 'quora-log.json');
const API_BASE = 'https://appscout-ai.vercel.app';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Helpers ───────────────────────────────────────────────────────────

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
}

function saveQueue(q) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2), 'utf8');
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

function alreadyGeneratedToday() {
  const log = loadLog();
  const today = new Date().toISOString().split('T')[0];
  return log.some((e) => e.action === 'generated' && e.timestamp.startsWith(today));
}

function usedQuestions() {
  const queue = loadQueue();
  return new Set(queue.map((q) => q.question));
}

function decideCTA() {
  const queue = loadQueue();
  const posted = queue.filter((q) => q.status === 'posted');
  const withLink = posted.filter((q) => q.ctaType !== 'none').length;
  const ratio = posted.length > 0 ? withLink / posted.length : 0;
  return ratio < 0.4 ? 'soft' : 'none';
}

function fetchTopApps() {
  return new Promise((resolve) => {
    https.get(`${API_BASE}/api/opportunities?limit=5`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data).slice(0, 3)); } catch { resolve([]); }
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

// ── Answer builder (same templates as generateAnswers.js) ─────────────

function buildAnswer(question, apps, ctaType) {
  const q = question.toLowerCase();
  const app = apps[0];
  const exampleLine = app
    ? `For example, right now there's a ${app.niche || 'productivity'} app with ${formatInstalls(app.installs)} installs that hasn't been updated in over ${Math.floor((app.daysSinceUpdate || 420) / 30)} months. The developer's email is public.`
    : `Right now there are apps with millions of installs that haven't been updated in over a year. Developer emails are public.`;

  const ctaLine = ctaType === 'soft'
    ? `\n\nI built a tool called AppScout that automates this scan across 19+ niches and surfaces scored opportunities weekly with developer contact included. Worth a look if you don't want to do the manual scouting: appscout-ai.vercel.app`
    : '';

  if (q.includes('flippa') || q.includes('alternative') || q.includes('marketplace') || q.includes('before they')) {
    return `Flippa is fine, but by the time something lists there you're competing against everyone — and the seller knows their leverage.

The better move is finding apps before they list anywhere.

**What to look for:**
- 100k–10M installs (proven demand)
- Last updated 12–36 months ago (developer has moved on)
- Solo indie owner, not a company
- Public email on the store page (you can reach them directly)

**${exampleLine}**

**Other off-market sources worth checking:**
- Reddit (r/androiddev, r/iOSProgramming) — search "looking to sell." You'll find developers who posted with zero replies. That's a warm lead with no competition.
- GitHub — abandoned repos with real download history.
- 1-star reviews complaining about crashes on a well-installed app — classic signal the dev has checked out.

The advantage over Flippa isn't just price. You can negotiate directly, move fast, and structure deals (revenue share, earnout, staged payment) that a marketplace doesn't allow.${ctaLine}`;
  }

  if (q.includes('abandoned') || q.includes('not updated') || q.includes('no longer') || q.includes('not maintained') || q.includes('2 years')) {
    return `Yes — and it's one of the most overlooked opportunities in the app space right now.

Here's the logic: most apps that get "abandoned" weren't failures. The developer got a job, had a kid, started a new project. The app still runs, still ranks on search, still gets organic installs. They just stopped caring.

**What that means for a buyer:**
- You're not buying a failure. You're buying an orphan.
- The demand is already proven (installs, ratings, search ranking)
- The price reflects abandonment, not underlying value
- The owner is often relieved someone reached out

**How to tell if it's worth pursuing:**
1. Install count still growing (check review dates — if recent reviews exist, users are still coming)
2. Complaints in reviews are about fixable things (crashes, outdated UI) not fundamental issues
3. Developer has a public email — they're reachable

**${exampleLine}**

The risk is real: some apps are abandoned because the niche died or the tech is unfixable. That's why a proper review of recent ratings and the developer's honest take on the codebase matters before you close.${ctaLine}`;
  }

  if (q.includes('partner') || q.includes('revenue share') || q.includes('struggling')) {
    return `Partnering with an indie developer is underused compared to outright acquisition — and often a better deal for both sides.

**When partnership makes more sense than buying:**
- The developer is still active but overwhelmed (marketing, monetization, updates)
- The app has real users but no revenue model
- The developer doesn't want to sell outright but would share upside

**How to structure a fair deal:**
- Revenue share: you handle growth/monetization, they keep the code. 50/50 is common for equal contribution.
- Co-founder arrangement: you become the business side, they stay technical.
- Acqui-hire lite: you pay a small upfront amount + give them equity in whatever you build on top.

**How to find these developers:**
Look for apps with decent install counts (100k+) that haven't been updated in 6–18 months — not long enough to be fully abandoned, but long enough that the developer is clearly distracted. Check Reddit too: r/androiddev and r/iOSProgramming have developers occasionally posting "looking for a co-founder" or "considering selling."

**${exampleLine}**

The opening email matters. Don't say "I want to buy your app." Say: "I noticed your app still has a strong user base — I'd love to understand where you'd like to take it." That starts a conversation, not a negotiation.${ctaLine}`;
  }

  if (q.includes('due diligence') || q.includes('value') || q.includes('worth') || q.includes('price') || q.includes('negotiate')) {
    return `Good question to ask before you sign anything. Here's what actually matters:

**Valuation basics for mobile apps:**
Most indie apps sell for 2–4x annual revenue. If there's no revenue, it's priced on installs and growth potential — typically $1–5 per monthly active user for a healthy app, less for a declining one.

**Due diligence checklist:**
1. **Revenue** — Ask for a screenshot of earnings (AdMob, in-app purchases, subscriptions). 30-day and 12-month numbers.
2. **Install trend** — Is the app growing, flat, or declining? Check the review dates. Recent reviews = people still finding it.
3. **Technical debt** — Ask what framework it's built on and when the codebase was last touched. A 6-year-old Java Android app with no documentation is a risk.
4. **Store standing** — Check for policy violations or previous suspensions. One warning can lead to removal.
5. **Third-party dependencies** — Does it rely on any APIs, SDKs, or services that might have changed or shut down?
6. **Ownership** — Make sure the developer owns it fully. No contractors with unclear IP claims.

**${exampleLine}**

For negotiation: the best leverage is information. Know what the app earns, know what's broken, and go in with a fair number based on multiples — not a lowball. Developers who've abandoned apps are often just happy someone cares. You don't need to lowball to get a good deal.${ctaLine}`;
  }

  if (q.includes('micro') || q.includes('small') || q.includes('budget') || q.includes('first time') || q.includes('get started')) {
    return `Micro-acquisitions in mobile apps are one of the best entry points into the acquisition game. Low competition, direct negotiation, fast close.

**What "micro" looks like in practice:**
- Under 100k installs: often $500–3k direct to developer
- 100k–500k installs, no revenue: $1k–10k
- 100k–500k installs with some monetization: $5k–30k
- 1M+ installs, broken execution: negotiable — seller knows it's worth something but also knows it's broken

**Where to start:**
1. Pick a niche you understand (not just "anything cheap")
2. Search that niche on Google Play, filter by last updated
3. Find apps with 50k+ installs, last updated 1+ year ago, solo developer
4. Find their email on the store page and send a short note

**${exampleLine}**

**First-time buyer tip:** Don't start with an app that needs a major rebuild. Start with something where the main issue is lack of marketing or a few missing updates — something you can improve without touching the codebase heavily.

The goal of the first acquisition isn't to hit a home run. It's to learn the process: due diligence, negotiation, transfer, first growth action. Keep it simple.${ctaLine}`;
  }

  // Default — general acquisition strategy
  return `The app acquisition market has a blind spot most people miss: off-market deals.

Apps that haven't been listed anywhere. Developers who haven't thought about selling — but would if someone reached out.

**The signals to look for:**
- 100k+ installs (proven demand exists)
- Last updated 12+ months ago (developer has moved on)
- Solo indie owner, not a company
- Public contact email on the store page

**${exampleLine}**

**Three plays once you find one:**

🎯 **Acquire** — Developer is fully gone, app is on autopilot. Buy it outright before it hits a marketplace.

🔨 **Rebuild** — App has real demand but broken execution (crashes, outdated UI). Build better, capture the same audience.

🤝 **Partner** — Developer is distracted but not gone. Propose revenue share or co-ownership.

**How to reach out:**
Don't say "I want to buy your app." Say: "I noticed your app still has a strong user base — would you be open to a conversation about its future?" Most developers reply within a week. Some are relieved someone noticed.

The key is moving before anyone else does. Once it's on Flippa the price goes up and you're competing.${ctaLine}`;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🤖 AppScout Quora Daily Run — ${new Date().toDateString()}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  if (alreadyGeneratedToday() && !DRY_RUN) {
    console.log(`✓ Already generated an answer today. Nothing to do.`);
    console.log(`  Check quora-drafts.md for today's answer.\n`);
    process.exit(0);
  }

  const used = usedQuestions();
  const remaining = QUESTION_BANK.filter((q) => !used.has(q.question));

  if (remaining.length === 0) {
    console.log(`⚠️  All ${QUESTION_BANK.length} questions in the bank have been used.`);
    console.log(`  Add more questions to questionBank.js to continue.\n`);
    appendLog({ action: 'bank_exhausted', questionsUsed: used.size });
    process.exit(0);
  }

  // Pick next question (rotate through categories for variety)
  const queue = loadQueue();
  const lastCategory = queue.length > 0 ? queue[queue.length - 1].category : null;
  let pick = remaining.find((q) => q.category !== lastCategory) || remaining[0];

  console.log(`📌 Question selected (${remaining.length} remaining in bank):`);
  console.log(`   "${pick.question}"`);
  console.log(`   Category: ${pick.category}\n`);

  console.log(`Fetching live app data from AppScout...`);
  const apps = await fetchTopApps();
  console.log(`Got ${apps.length} live examples.\n`);

  const ctaType = decideCTA();
  console.log(`CTA: ${ctaType} (60/40 link budget enforced)\n`);

  const body = buildAnswer(pick.question, apps, ctaType);
  const scored = scoreAnswer({ question: pick.question, body, ctaType });

  console.log(`📊 Scores:`);
  console.log(`   Relevance : ${scored.scores.relevance}/100`);
  console.log(`   Quality   : ${scored.scores.quality}/100`);
  console.log(`   Risk      : ${scored.scores.risk}/100`);
  console.log(`   Status    : ${scored.status}`);

  if (scored.flags.length) {
    scored.flags.forEach((f) => console.log(`   ⚠️  ${f}`));
  }

  if (DRY_RUN) {
    console.log(`\n── Answer Preview ───────────────────────────────\n`);
    console.log(body);
    console.log(`\n─────────────────────────────────────────────────`);
    console.log(`Dry run complete. No files written.\n`);
    return;
  }

  const entry = {
    id: Date.now(),
    question: pick.question,
    url: pick.url,
    category: pick.category,
    body,
    ctaType,
    scores: scored.scores,
    status: scored.status,
    reason: scored.reason,
    generatedAt: new Date().toISOString(),
    postedAt: null,
  };

  // Save to queue
  const q = loadQueue();
  q.push(entry);
  saveQueue(q);

  // Append to drafts
  const draftBlock = `
---

## ${entry.question}

**URL:** ${entry.url}
**Category:** ${entry.category}
**Status:** ${entry.status}
**Scores:** Relevance ${entry.scores.relevance} · Quality ${entry.scores.quality} · Risk ${entry.scores.risk}
**CTA:** ${entry.ctaType}
**Generated:** ${entry.generatedAt}

${entry.body}

`;
  fs.appendFileSync(DRAFTS_FILE, draftBlock, 'utf8');

  appendLog({
    action: 'generated',
    id: entry.id,
    question: entry.question,
    category: entry.category,
    status: entry.status,
    scores: scored.scores,
  });

  console.log(`\n✅ Done.`);
  console.log(`   Saved to: quora-drafts.md`);

  if (entry.status === 'approved') {
    console.log(`\n👉 Ready to post:`);
    console.log(`   1. Open: ${entry.url}`);
    console.log(`      (Search Quora for the question above if the link doesn't go direct)`);
    console.log(`   2. Click "Answer" → paste the text from quora-drafts.md`);
    console.log(`   3. Submit`);
    console.log(`   4. Run: node quoraPublisher.js --id ${entry.id} --confirm\n`);
  } else {
    console.log(`\n⚠️  Status is "${entry.status}" — review quora-drafts.md before posting.\n`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
