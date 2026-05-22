/**
 * email-subscribers.js
 * Fetches all Gumroad buyers, sends them the latest report via Resend.
 * Run after auto-report.js.
 *
 * Required env vars:
 *   GUMROAD_ACCESS_TOKEN   — from Gumroad Settings > Advanced
 *   GUMROAD_PRODUCT_ID     — the product permalink (e.g. "flfjnx")
 *   RESEND_API_KEY         — from resend.com dashboard
 *   FROM_EMAIL             — verified sender, e.g. "AppScout <reports@yourdomain.com>"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── Config ───────────────────────────────────────────────────────────────────

const GUMROAD_TOKEN  = process.env.GUMROAD_ACCESS_TOKEN;
const PRODUCT_ID     = process.env.GUMROAD_PRODUCT_ID || 'flfjnx';
const RESEND_KEY     = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.FROM_EMAIL || 'AppScout <reports@appscout.io>';

if (!GUMROAD_TOKEN || !RESEND_KEY) {
  console.error('Missing env vars: GUMROAD_ACCESS_TOKEN and/or RESEND_API_KEY');
  process.exit(1);
}

// ─── Load report ─────────────────────────────────────────────────────────────

const reportPath = path.join(ROOT, 'web', 'private', 'reports', 'latest-report.md');
if (!fs.existsSync(reportPath)) {
  console.error('No report found — run auto-report.js first');
  process.exit(1);
}

const reportMd = fs.readFileSync(reportPath, 'utf8');

// Extract week number from first line
const weekMatch = reportMd.match(/Week (\d+) Report/);
const weekNum = weekMatch ? weekMatch[1] : 'Latest';

// ─── Gumroad: fetch all buyer emails ─────────────────────────────────────────

async function fetchGumroadBuyers() {
  const emails = new Set();
  let page = 1;

  while (true) {
    const url = `https://api.gumroad.com/v2/products/${PRODUCT_ID}/sales?page=${page}&page_key=${page}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${GUMROAD_TOKEN}` },
    });

    if (!res.ok) {
      console.error(`Gumroad API error: ${res.status}`);
      break;
    }

    const json = await res.json();
    if (!json.success || !json.sales?.length) break;

    for (const sale of json.sales) {
      if (sale.email) emails.add(sale.email.toLowerCase());
      // Also capture purchaser's email from purchase_email field
      if (sale.purchase_email) emails.add(sale.purchase_email.toLowerCase());
    }

    if (json.sales.length < 10) break; // last page
    page++;
    await new Promise(r => setTimeout(r, 300));
  }

  return [...emails];
}

// ─── Build HTML email ─────────────────────────────────────────────────────────

function markdownToHtml(md) {
  // Simple markdown → HTML for email (no external dependency)
  return md
    .replace(/^# (.+)$/gm, '<h1 style="color:#1a1a2e;margin-bottom:4px">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#16213e;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="color:#0f3460;margin-top:20px">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px">$1</code>')
    .replace(/^- \[ \] (.+)$/gm, '<li style="list-style:none">☐ $1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\| (.+) \|$/gm, (row) => {
      const cells = row.slice(2, -2).split(' | ');
      return '<tr>' + cells.map(c => `<td style="padding:6px 10px;border:1px solid #e5e7eb">${c}</td>`).join('') + '</tr>';
    })
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">')
    .replace(/\n\n/g, '<br><br>');
}

function buildEmailHtml(reportMd, weekNum) {
  const htmlBody = markdownToHtml(reportMd);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center">
      <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">AppScout</div>
      <div style="color:#94a3b8;margin-top:6px;font-size:14px">Week ${weekNum} Report · App Acquisition Intelligence</div>
    </div>

    <!-- Intro -->
    <div style="padding:28px 32px 0">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0">
        Your weekly scan is ready. Below are this week's top acquisition targets, rebuild opportunities, and watch list — all human-reviewed.
      </p>
    </div>

    <!-- Report body -->
    <div style="padding:20px 32px;color:#374151;font-size:14px;line-height:1.7">
      ${htmlBody}
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
      <p style="color:#9ca3af;font-size:12px;margin:0">
        You're receiving this because you purchased an AppScout report.<br>
        All data from public App Store and Google Play listings · Not financial advice.<br>
        <strong>Do not share — contains private developer contact information.</strong>
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Resend: send emails ──────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }

  return res.json();
}

async function sendInBatches(emails, subject, html, batchSize = 10, delayMs = 1000) {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (email) => {
        try {
          await sendEmail(email, subject, html);
          sent++;
        } catch (err) {
          console.error(`  ✗ ${email}: ${err.message}`);
          failed++;
        }
      })
    );
    if (i + batchSize < emails.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return { sent, failed };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('Fetching Gumroad buyer list...');
const emails = await fetchGumroadBuyers();
console.log(`Found ${emails.length} subscriber${emails.length === 1 ? '' : 's'}`);

if (!emails.length) {
  console.log('No subscribers yet — nothing to send.');
  process.exit(0);
}

const subject = `AppScout Week ${weekNum} Report — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
const html = buildEmailHtml(reportMd, weekNum);

console.log(`Sending report to ${emails.length} subscriber(s)...`);
const { sent, failed } = await sendInBatches(emails, subject, html);

console.log(`✓ Sent: ${sent}  ✗ Failed: ${failed}`);
