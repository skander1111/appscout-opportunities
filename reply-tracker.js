// Manual reply tracker — paste a reply to mark a lead as replied and get next-action suggestions
// Usage:
//   node reply-tracker.js list
//   node reply-tracker.js mark <leadId> <outcome>   outcome: replied | not-interested | no-response | bounced
//   node reply-tracker.js note <leadId> "their message summary"

import fs from 'fs';

const QUEUE_FILE = 'data/outreach/outreach-queue.json';
const LOG_FILE = 'data/outreach/outreach-log.json';

function loadJSON(path) {
  if (!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function nextAction(outcome, lead) {
  switch (outcome) {
    case 'replied':
      return `Schedule a call or reply with price discovery questions. Ask: "Are you open to discussing a sale, or more interested in a partnership?" Keep it short.`;
    case 'not-interested':
      return `Mark as closed. No further contact. Consider logging the niche for future reference.`;
    case 'bounced':
      return `Email address invalid. Try finding another contact: check app Store listing, GitHub, LinkedIn, or their personal website.`;
    case 'no-response':
      return lead.followUpSent
        ? `Both emails sent with no response. Archive this lead — try again in 3–6 months if the app is still abandoned.`
        : `Follow-up hasn't been sent yet. Wait until ${lead.followUpAt?.split('T')[0]} and let outreach-engine.js handle it automatically.`;
    default:
      return 'Unknown outcome.';
  }
}

function listLeads(queue) {
  if (!queue.length) {
    console.log('No leads in queue.');
    return;
  }

  console.log('\n=== Outreach Queue ===\n');
  for (const lead of queue) {
    const followUpDate = lead.followUpAt?.split('T')[0] || '—';
    const followUpStatus = lead.followUpSent ? 'follow-up sent' : `follow-up due ${followUpDate}`;
    const replyStatus = lead.replyDetected ? '✓ replied' : '— no reply';

    console.log(`[${lead.id}]`);
    console.log(`  App:       ${lead.appName}`);
    console.log(`  Email:     ${lead.developerEmail}`);
    console.log(`  Status:    ${lead.status}`);
    console.log(`  Sent:      ${lead.sentAt?.split('T')[0]}`);
    console.log(`  Reply:     ${replyStatus}`);
    console.log(`  Follow-up: ${followUpStatus}`);
    if (lead.replyNote) console.log(`  Note:      ${lead.replyNote}`);
    console.log();
  }
}

function markOutcome(queue, log, leadId, outcome) {
  const lead = queue.find(l => l.id === leadId);
  if (!lead) {
    console.error(`Lead not found: ${leadId}`);
    process.exit(1);
  }

  const VALID = ['replied', 'not-interested', 'no-response', 'bounced'];
  if (!VALID.includes(outcome)) {
    console.error(`Invalid outcome. Use one of: ${VALID.join(', ')}`);
    process.exit(1);
  }

  const statusMap = {
    replied: 'replied',
    'not-interested': 'closed-not-interested',
    bounced: 'closed-bounced',
    'no-response': lead.followUpSent ? 'closed-no-response' : lead.status,
  };

  lead.status = statusMap[outcome];
  lead.replyDetected = outcome === 'replied';
  lead.outcomeRecordedAt = new Date().toISOString();
  lead.outcome = outcome;

  log.push({
    event: 'outcome-recorded',
    leadId,
    outcome,
    appName: lead.appName,
    timestamp: lead.outcomeRecordedAt,
  });

  saveJSON(QUEUE_FILE, queue);
  saveJSON(LOG_FILE, log);

  console.log(`\n✓ Marked ${lead.appName} as: ${outcome}`);
  console.log(`\nNext action: ${nextAction(outcome, lead)}\n`);
}

function addNote(queue, log, leadId, note) {
  const lead = queue.find(l => l.id === leadId);
  if (!lead) {
    console.error(`Lead not found: ${leadId}`);
    process.exit(1);
  }

  lead.replyNote = note;
  lead.replyNoteAt = new Date().toISOString();

  log.push({
    event: 'note-added',
    leadId,
    note,
    appName: lead.appName,
    timestamp: lead.replyNoteAt,
  });

  saveJSON(QUEUE_FILE, queue);
  saveJSON(LOG_FILE, log);

  console.log(`\n✓ Note saved for ${lead.appName}: "${note}"\n`);
}

const [,, command, leadId, ...rest] = process.argv;
const queue = loadJSON(QUEUE_FILE);
const log = loadJSON(LOG_FILE);

switch (command) {
  case 'list':
    listLeads(queue);
    break;
  case 'mark':
    if (!leadId || !rest[0]) {
      console.error('Usage: node reply-tracker.js mark <leadId> <outcome>');
      process.exit(1);
    }
    markOutcome(queue, log, leadId, rest[0]);
    break;
  case 'note':
    if (!leadId || !rest[0]) {
      console.error('Usage: node reply-tracker.js note <leadId> "message"');
      process.exit(1);
    }
    addNote(queue, log, leadId, rest.join(' '));
    break;
  default:
    console.log('Usage:');
    console.log('  node reply-tracker.js list');
    console.log('  node reply-tracker.js mark <leadId> <outcome>');
    console.log('    outcomes: replied | not-interested | no-response | bounced');
    console.log('  node reply-tracker.js note <leadId> "their message summary"');
}
