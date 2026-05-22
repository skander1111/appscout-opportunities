// Outreach draft generator — READ ONLY, no emails sent
// All drafts require manual review and approval before sending

import fs from 'fs';

const opportunities = JSON.parse(
  fs.readFileSync('data/reports/top-opportunities.json', 'utf-8')
);

// Only generate outreach for genuine acquisition targets with contact info
const contactable = opportunities.filter(o =>
  o.strategy === 'Contact developer' &&
  o.developerEmail &&
  o.riskLabel !== 'High' &&
  o.ownerType !== 'Big company'
);

// ── Email templates ───────────────────────────────────────────────────────────

function buildSubjectLine(app) {
  // Short, non-aggressive, references the specific app
  return `Question about ${app.name}`;
}

function buildEmailBody(app) {
  const dayYears = app.daysSinceUpdate >= 730
    ? `${Math.round(app.daysSinceUpdate / 365 * 10) / 10} years`
    : `${Math.round(app.daysSinceUpdate / 30)} months`;

  const installs = app.installs;

  // Craft a specific opening that references visible facts (not scraped data we shouldn't mention)
  const opening = app.ownerType === 'Solo indie'
    ? `I came across your app ${app.name} on Google Play`
    : `I came across ${app.name} on Google Play`;

  // Note a specific visible signal they would expect us to see
  const observation = app.mainComplaints?.length > 0
    ? `I noticed the app has ${installs} installs and users in the reviews are asking for updates around ${app.mainComplaints.slice(0, 2).join(' and ')}.`
    : `I noticed the app has ${installs} installs and looks like it hasn't had an update in a while.`;

  const ask = app.daysSinceUpdate >= 365
    ? `I wanted to reach out and ask — are you still actively working on it? I'm exploring whether you might be open to a conversation about acquisition, a partnership, or any other arrangement that might work for you.`
    : `I wanted to reach out and ask if you might be open to a conversation about the app's future — whether that's acquisition, partnership, or something else entirely.`;

  return `Hi,

${opening} and wanted to get in touch with you directly.

${observation}

${ask}

No pressure at all — just an initial conversation to understand your plans and see if there's any common ground.

If you're not interested, no hard feelings at all. And if the timing isn't right now, feel free to reach out later.

Best,
[Your name]
[Your email / LinkedIn]`;
}

function buildFollowUp(app) {
  return `Hi,

I sent a message a couple of weeks ago about ${app.name} — just wanted to follow up in case my first message got lost.

I'm genuinely interested in discussing the app's future if you ever have a moment to chat.

No pressure either way — happy to hear a simple yes or no.

Best,
[Your name]`;
}

// ── Due diligence questions ───────────────────────────────────────────────────

function buildDueDiligence(app) {
  return `## Due Diligence Checklist — ${app.name}

Use these questions once the developer replies and signals openness to a deal.
Do NOT ask all of these in the first email.

### Business
- [ ] What is the current monthly active user count?
- [ ] Does the app generate any revenue? (ads, IAP, subscriptions)
- [ ] What is the monthly ad revenue (approximate)?
- [ ] What is the monthly IAP revenue (approximate)?
- [ ] Are there any recurring costs? (servers, APIs, services)

### Technical
- [ ] Is the source code available and owned by you entirely?
- [ ] Are there any third-party libraries or services that require separate licensing?
- [ ] Can the Google Play Console listing be transferred to a new account?
- [ ] Is there a backend/server, and is it included in the sale?
- [ ] What platform/language is the app built in?

### Legal
- [ ] Do you own all app icons, graphics, and brand assets outright?
- [ ] Is any content licensed from a third party (music, images, fonts)?
- [ ] Are there any active user complaints, legal disputes, or DMCA claims?
- [ ] Does the app collect user data? If so, what data and where is it stored?
- [ ] Is there an active privacy policy, and who is responsible for GDPR/compliance?

### Deal
- [ ] Do you have a price in mind?
- [ ] Are you open to an installment payment or revenue-share structure?
- [ ] What is your ideal timeline for transfer?
- [ ] Is there anything about the app's history I should know before buying?`;
}

// ── Generate all drafts ───────────────────────────────────────────────────────

const lines = [
  '# AppScout — Outreach Drafts',
  '**STATUS: DRAFTS ONLY — do not send without manual review**',
  '',
  `Generated for ${contactable.length} contactable acquisition targets.`,
  '',
  '> Review each draft. Edit the [Your name] placeholder. Personalize if needed.',
  '> Send from your personal email account, not automated.',
  '',
  '---',
  '',
];

contactable.slice(0, 8).forEach((app, i) => {
  lines.push(`# ${i + 1}. ${app.name}`);
  lines.push('');
  lines.push(`**App:** [${app.name}](${app.url})`);
  lines.push(`**Developer:** ${app.developer}`);
  lines.push(`**Owner type:** ${app.ownerType}`);
  lines.push(`**Installs:** ${app.installs} | **Rating:** ${app.rating?.toFixed(2) ?? 'N/A'} | **Days inactive:** ${app.daysSinceUpdate}`);
  lines.push(`**Risk:** ${app.riskLabel} ${app.riskFlags.length ? '— ' + app.riskFlags.join(', ') : ''}`);
  lines.push('');
  lines.push('## First Email');
  lines.push('');
  lines.push(`**To:** ${app.developerEmail}`);
  lines.push(`**Subject:** ${buildSubjectLine(app)}`);
  lines.push('');
  lines.push('```');
  lines.push(buildEmailBody(app));
  lines.push('```');
  lines.push('');
  lines.push('## Follow-up (send after 2 weeks with no reply)');
  lines.push('');
  lines.push('```');
  lines.push(buildFollowUp(app));
  lines.push('```');
  lines.push('');
  lines.push(buildDueDiligence(app));
  lines.push('');
  lines.push('---');
  lines.push('');
});

// ── General due diligence checklist ──────────────────────────────────────────

lines.push('# General Due Diligence Checklist');
lines.push('*Use this template for any app acquisition conversation.*');
lines.push('');
lines.push(buildDueDiligence({
  name: '[App Name]',
  url: '[URL]',
}));

fs.mkdirSync('data/reports', { recursive: true });
fs.writeFileSync('data/reports/outreach-drafts.md', lines.join('\n'));

// ── Console output ────────────────────────────────────────────────────────────

console.log('\n════════════════════════════════════════════════');
console.log('  OUTREACH DRAFTS GENERATED');
console.log('════════════════════════════════════════════════\n');

contactable.slice(0, 5).forEach((app, i) => {
  console.log(`${i + 1}. ${app.name}`);
  console.log(`   To: ${app.developerEmail}`);
  console.log(`   Subject: ${buildSubjectLine(app)}`);
  console.log(`   Risk: ${app.riskLabel}${app.riskFlags.length ? ' — ' + app.riskFlags[0] : ''}`);
  console.log();
});

console.log('✓ Saved: data/reports/outreach-drafts.md');
console.log('\n⚠️  REMINDER: Do not send these automatically.');
console.log('    Review each draft. Edit [Your name]. Send manually from personal email.\n');

const firstContact = contactable[0];
if (firstContact) {
  console.log('════════════════════════════════════════════════');
  console.log('  SEND THIS ONE FIRST');
  console.log('════════════════════════════════════════════════\n');
  console.log(`App:     ${firstContact.name}`);
  console.log(`Email:   ${firstContact.developerEmail}`);
  console.log(`Subject: ${buildSubjectLine(firstContact)}`);
  console.log(`Why:     ${firstContact.whyInteresting[0] || firstContact.recommendation}`);
  console.log(`Risk:    ${firstContact.riskLabel}`);
  console.log();
}
