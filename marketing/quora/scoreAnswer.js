#!/usr/bin/env node
/**
 * scoreAnswer.js
 * Scores a Quora answer draft on relevance, quality, and risk.
 * Returns an object with scores and a recommendation.
 * Minimum quality score to post: 85/100.
 */

const QUALITY_MIN = 85;

/**
 * @param {object} answer
 * @param {string} answer.question  - The Quora question title
 * @param {string} answer.body      - The answer text
 * @param {string} answer.ctaType   - 'none' | 'soft' | 'link'
 * @returns {object} scores + recommendation
 */
function scoreAnswer({ question, body, ctaType }) {
  const scores = {};
  const flags = [];

  // ── Relevance ──────────────────────────────────────────────────────
  const RELEVANT_KEYWORDS = [
    'app', 'mobile', 'acquire', 'acquisition', 'buy', 'purchase',
    'abandoned', 'inactive', 'developer', 'indie', 'flippa',
    'install', 'google play', 'app store', 'startup', 'opportunity',
    'rebuild', 'partner', 'revenue', 'micro-acquisition',
  ];
  const q = question.toLowerCase();
  const matchCount = RELEVANT_KEYWORDS.filter((k) => q.includes(k)).length;
  scores.relevance = Math.min(100, 50 + matchCount * 5);
  if (scores.relevance < 60) flags.push('Low relevance — question may not be on-topic');

  // ── Quality ────────────────────────────────────────────────────────
  let quality = 100;
  const wordCount = body.trim().split(/\s+/).length;

  if (wordCount < 80) { quality -= 20; flags.push('Too short (< 80 words)'); }
  if (wordCount > 600) { quality -= 10; flags.push('Too long (> 600 words) — consider trimming'); }
  if (body.includes('AppScout') && ctaType === 'none') { quality -= 15; flags.push('Mentions AppScout but CTA type is "none" — inconsistent'); }
  if ((body.match(/AppScout/g) || []).length > 2) { quality -= 20; flags.push('Mentions AppScout more than twice — too promotional'); }
  if (/click here|buy now|sign up now|limited time/i.test(body)) { quality -= 25; flags.push('Aggressive sales language detected'); }
  if (!/\n/.test(body)) { quality -= 10; flags.push('No line breaks — hard to read'); }
  if (body.split('\n').filter((l) => l.trim()).length < 3) { quality -= 10; flags.push('Less than 3 paragraphs — needs more structure'); }

  scores.quality = Math.max(0, quality);
  if (scores.quality < QUALITY_MIN) flags.push(`Quality score ${scores.quality} below minimum ${QUALITY_MIN} — save as draft`);

  // ── Risk ───────────────────────────────────────────────────────────
  let risk = 0;
  if (ctaType === 'link') risk += 15;
  if ((body.match(/appscout-ai\.vercel\.app/g) || []).length > 1) { risk += 20; flags.push('Multiple links — high spam risk'); }
  if (/check out|visit|go to|head over/i.test(body)) { risk += 10; flags.push('Directive link language increases spam signal'); }
  if (wordCount < 60) { risk += 20; flags.push('Very short answers with links look like spam'); }

  scores.risk = Math.min(100, risk);
  if (scores.risk > 40) flags.push('High risk score — post without link or save as draft');

  // ── Recommendation ─────────────────────────────────────────────────
  let status;
  if (scores.quality >= QUALITY_MIN && scores.risk <= 40 && scores.relevance >= 60) {
    status = 'approved';
  } else if (scores.quality >= 70) {
    status = 'draft';
  } else {
    status = 'skipped';
  }

  const reason = flags.length
    ? flags.join(' | ')
    : 'Meets all quality, relevance, and risk thresholds.';

  return { scores, status, reason, flags };
}

module.exports = { scoreAnswer, QUALITY_MIN };

// CLI usage: node scoreAnswer.js (runs self-test)
if (require.main === module) {
  const sample = {
    question: 'How do I find mobile apps to acquire without using Flippa?',
    body: `Great question — this is something more people are exploring as Flippa gets more competitive.

The best off-market app deals happen before the seller even lists anywhere. Here's what works:

**1. Look for abandonment signals**
Search Google Play or the App Store for apps in a niche you know. Sort by last updated. Any app with 500k+ installs that hasn't been updated in 12+ months is worth a look. The developer may have moved on.

**2. Check the developer's public contact**
Most indie developers list an email on their store page. A short, non-pushy email asking if they'd be open to a conversation about the app's future gets surprisingly high response rates.

**3. Watch Reddit**
r/androiddev, r/iOSProgramming, and r/startups occasionally have developers posting "looking to sell my app." These leads are often cold — nobody replied — which means zero competition for you.

I've been using a tool called AppScout that automates this scan across 19+ niches and surfaces scored opportunities weekly. It's useful if you don't want to do the manual scouting yourself.

The key is to move before the app hits a marketplace. Once it's listed, the price goes up and you're competing.`,
    ctaType: 'soft',
  };

  const result = scoreAnswer(sample);
  console.log('\n📊 Score Result');
  console.log('───────────────');
  console.log(`Relevance: ${result.scores.relevance}/100`);
  console.log(`Quality:   ${result.scores.quality}/100`);
  console.log(`Risk:      ${result.scores.risk}/100`);
  console.log(`Status:    ${result.status}`);
  console.log(`Reason:    ${result.reason}`);
}
