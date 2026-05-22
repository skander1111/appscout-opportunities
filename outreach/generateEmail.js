// Generates personalized outreach emails — never sends

const SENDER_NAME = 'Skander Aloui';

function extractFirstName(developerName) {
  if (!developerName) return null;
  // Strip common studio/company suffixes
  const cleaned = developerName
    .replace(/\b(LLC|Inc\.?|Ltd\.?|GmbH|Studio|Apps?|Games?|Team|Group|Labs?|Technologies?|Solutions?|Digital|Mobile|Software|Dev)\b/gi, '')
    .trim();
  const words = cleaned.split(/\s+/).filter(w => w.length > 1);
  // Only use as first name if it looks like a real person's name (capitalized, not all-caps)
  if (words.length >= 1 && /^[A-Z][a-z]+$/.test(words[0])) return words[0];
  return null;
}

function greeting(developerName) {
  const first = extractFirstName(developerName);
  return first ? `Hi ${first},` : 'Hi,';
}

export function generateAcquisitionEmail(app) {
  const monthsOld = Math.round((app.daysSinceUpdate || 0) / 30);
  const timeSignal = monthsOld >= 18
    ? `looks like it hasn't had an update in quite a while`
    : `looks like updates have slowed down`;

  const subject = `Question about ${app.title}`;

  const body = `${greeting(app.developer)}

I came across your app ${app.title} on Google Play and wanted to reach out directly.

I noticed it has ${app.installs} installs and ${timeSignal} — I wasn't sure if you're still actively working on it.

I'm exploring whether you might be open to a conversation about the app's future — whether that's acquisition, a partnership, or something else entirely.

No pressure at all. Just curious if you're still working on it, or if it might be the right time to pass it on.

Happy to keep this very casual if you'd like to chat.

Best,
${SENDER_NAME}`;

  return { subject, body, senderName: SENDER_NAME };
}

export function generateRebuildInquiry(app) {
  const subject = `Quick question — ${app.title}`;

  const complaints = app.mainComplaints?.length
    ? `I've seen users mention ${app.mainComplaints.slice(0, 2).join(' and ')} in the reviews`
    : `I noticed some user feedback worth discussing`;

  const body = `${greeting(app.developer)}

I came across ${app.title} while researching apps in the ${app.niche} space.

${complaints}. I'd love to understand more about your current plans for the app.

Are you open to a quick chat about it?

Best,
${SENDER_NAME}`;

  return { subject, body, senderName: SENDER_NAME };
}

export function generateFollowUp(app, originalSentAt) {
  const subject = `Re: Question about ${app.title}`;

  const body = `${greeting(app.developer)}

I sent a message a couple of weeks ago about ${app.title} — just following up in case it got lost.

I'm still genuinely interested in a quick conversation if you ever have a moment.

No pressure either way — a simple yes or no is completely fine.

Best,
${SENDER_NAME}`;

  return { subject, body, senderName: SENDER_NAME };
}

export function selectEmailType(app) {
  if (app.strategy === 'Contact developer') return 'acquisition';
  if (app.strategy === 'Build better version') return 'rebuild';
  return 'acquisition';
}
