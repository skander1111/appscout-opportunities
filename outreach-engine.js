import fs from 'fs';
import { verifyLead } from './outreach/verifyLead.js';
import { generateAcquisitionEmail, generateRebuildInquiry, selectEmailType } from './outreach/generateEmail.js';
import { send } from './outreach/providers/mockProvider.js';
import { getFollowUpCandidates, prepareFollowUps, markFollowUpSent } from './outreach/followup.js';

const OPPORTUNITIES_FILE = 'data/reports/top-opportunities.json';
const QUEUE_FILE = 'data/outreach/outreach-queue.json';
const LOG_FILE = 'data/outreach/outreach-log.json';
const FOLLOW_UP_DAYS = 6;

function loadJSON(path) {
  if (!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function normalizeApp(opp) {
  return {
    ...opp,
    score: opp.rating,
    title: opp.name,
    appName: opp.name,
  };
}

function makeLeadId(app) {
  return `${(app.appId || app.name).toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
}

function followUpTimestamp() {
  const d = new Date();
  d.setDate(d.getDate() + FOLLOW_UP_DAYS);
  return d.toISOString();
}

async function runOutreachEngine() {
  const opportunities = loadJSON(OPPORTUNITIES_FILE);
  let queue = loadJSON(QUEUE_FILE);
  const log = loadJSON(LOG_FILE);

  const queued = [];
  const skipped = [];

  console.log('\n=== AppScout Outreach Engine (DRY RUN) ===');
  console.log(`Loaded ${opportunities.length} opportunities from top-opportunities.json\n`);

  // Phase 1: Queue new outreach for verified leads
  for (const opp of opportunities) {
    const app = normalizeApp(opp);
    const { approved, reasons, warnings } = verifyLead(app, queue);

    if (!approved) {
      skipped.push({ appName: app.name, reasons });
      continue;
    }

    const emailType = selectEmailType(app);
    const email = emailType === 'rebuild'
      ? generateRebuildInquiry(app)
      : generateAcquisitionEmail(app);

    const result = await send({
      to: app.developerEmail,
      ...email,
      metadata: {
        appName: app.name,
        emailType,
        opportunityScore: app.opportunityScore,
        ownerType: app.ownerType,
      },
    });

    const entry = {
      id: makeLeadId(app),
      appName: app.name,
      appId: app.appId,
      developerName: app.developer,
      developerEmail: app.developerEmail,
      ownerType: app.ownerType,
      opportunityScore: app.opportunityScore,
      niche: app.niche,
      emailType,
      status: 'sent',
      sentAt: result.timestamp,
      followUpAt: followUpTimestamp(),
      followUpSent: false,
      replyDetected: false,
      provider: result.provider,
      messageId: result.messageId,
      dryRun: result.dryRun ?? false,
      warnings,
    };

    queue.push(entry);
    log.push({ event: 'sent', ...entry });
    queued.push(entry);

    const prefix = warnings.length ? '⚠ ' : '✓ ';
    console.log(`${prefix} ${app.name} → ${app.developerEmail} [${emailType}]`);
    warnings.forEach(w => console.log(`    ! ${w}`));
  }

  // Phase 2: Send follow-ups for overdue leads
  const followUpDrafts = prepareFollowUps(queue);

  for (const draft of followUpDrafts) {
    const result = await send({
      to: draft.to,
      subject: draft.subject,
      body: draft.body,
      senderName: draft.senderName,
      metadata: { appName: draft.appName, emailType: 'follow-up' },
    });

    queue = markFollowUpSent(queue, draft.leadId);
    log.push({
      event: 'follow-up-sent',
      leadId: draft.leadId,
      appName: draft.appName,
      sentAt: result.timestamp,
      messageId: result.messageId,
      dryRun: result.dryRun ?? false,
    });

    console.log(`↩  Follow-up: ${draft.appName} → ${draft.to}`);
  }

  saveJSON(QUEUE_FILE, queue);
  saveJSON(LOG_FILE, log);

  // Summary
  console.log('\n--- Run Summary ---');
  console.log(`New leads queued:   ${queued.length}`);
  console.log(`Skipped:            ${skipped.length}`);
  console.log(`Follow-ups sent:    ${followUpDrafts.length}`);

  if (skipped.length) {
    console.log('\nSkipped:');
    for (const s of skipped) {
      console.log(`  ✗ ${s.appName}`);
      s.reasons.forEach(r => console.log(`    · ${r}`));
    }
  }

  if (queued.length) {
    console.log('\nNext follow-up dates:');
    for (const q of queued) {
      const date = q.followUpAt.split('T')[0];
      console.log(`  ${date}  ${q.appName}`);
    }
  }

  console.log('\nDry-run emails: data/outreach/dry-run-emails.md');
  console.log('Queue:          data/outreach/outreach-queue.json');
  console.log('Log:            data/outreach/outreach-log.json\n');
}

runOutreachEngine().catch(err => {
  console.error('Outreach engine failed:', err.message);
  process.exit(1);
});
