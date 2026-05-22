// Mock email provider — writes to dry-run log instead of sending
// Replace with gmailProvider.js or resendProvider.js when ready

import fs from 'fs';

const DRY_RUN_FILE = 'data/outreach/dry-run-emails.md';

export async function send({ to, subject, body, senderName, metadata }) {
  const timestamp = new Date().toISOString();

  const entry = [
    `\n## ${metadata?.appName || to} — ${timestamp}`,
    `**To:** ${to}`,
    `**Subject:** ${subject}`,
    `**Type:** ${metadata?.emailType || 'outreach'}`,
    `**Score:** ${metadata?.opportunityScore || '?'}`,
    `**Owner:** ${metadata?.ownerType || '?'}`,
    '',
    '```',
    body,
    '```',
    '',
    '---',
  ].join('\n');

  fs.appendFileSync(DRY_RUN_FILE, entry + '\n');

  return {
    success: true,
    provider: 'mock',
    messageId: `mock-${Date.now()}`,
    timestamp,
    dryRun: true,
  };
}
