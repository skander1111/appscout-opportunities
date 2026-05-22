import fs from 'fs';
import { generateFollowUp } from './generateEmail.js';

const FOLLOW_UP_DAYS = 6;
const QUEUE_FILE = 'data/outreach/outreach-queue.json';

export function getFollowUpCandidates(queue) {
  const now = Date.now();
  return queue.filter(lead => {
    if (lead.status !== 'sent') return false;
    if (lead.replyDetected) return false;
    if (lead.followUpSent) return false;

    const followUpDate = new Date(lead.followUpAt).getTime();
    return now >= followUpDate;
  });
}

export function prepareFollowUps(queue) {
  const candidates = getFollowUpCandidates(queue);
  const drafts = [];

  for (const lead of candidates) {
    const email = generateFollowUp(
      { title: lead.appName, developer: lead.developerName },
      lead.sentAt
    );
    drafts.push({
      leadId: lead.id,
      appName: lead.appName,
      to: lead.developerEmail,
      ...email,
      scheduledFor: new Date().toISOString(),
    });
  }

  return drafts;
}

export function markFollowUpSent(queue, leadId) {
  return queue.map(lead =>
    lead.id === leadId
      ? { ...lead, followUpSent: true, followUpSentAt: new Date().toISOString(), status: 'follow-up-sent' }
      : lead
  );
}
