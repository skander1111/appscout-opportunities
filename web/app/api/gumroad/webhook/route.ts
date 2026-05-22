/**
 * POST /api/gumroad/webhook
 * Gumroad calls this on every new sale.
 * Sends the buyer the latest report immediately via Resend.
 *
 * Env vars required:
 *   GUMROAD_WEBHOOK_SECRET  — set in Gumroad product settings (optional but recommended)
 *   RESEND_API_KEY
 *   FROM_EMAIL              — e.g. "AppScout <reports@appscout.io>"
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RESEND_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = process.env.FROM_EMAIL || 'AppScout <noreply@appscout.io>';
const WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET;

function markdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1 style="color:#1a1a2e;margin-bottom:4px">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#16213e;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="color:#0f3460;margin-top:20px">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px">$1</code>')
    .replace(/^- \[ \] (.+)$/gm, '<li style="list-style:none">☐ $1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">')
    .replace(/\n\n/g, '<br><br>');
}

function buildWelcomeEmail(buyerName: string, reportMd: string, weekNum: string): string {
  const htmlBody = markdownToHtml(reportMd);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center">
      <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">AppScout</div>
      <div style="color:#94a3b8;margin-top:6px;font-size:14px">Your report is ready</div>
    </div>

    <div style="padding:28px 32px 0">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0">
        Hey${buyerName ? ` ${buyerName}` : ''},<br><br>
        Thank you for your purchase! Here's your Week ${weekNum} AppScout report — top iOS and Android app acquisition opportunities, human-reviewed.
      </p>
    </div>

    <div style="padding:20px 32px;color:#374151;font-size:14px;line-height:1.7">
      ${htmlBody}
    </div>

    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
      <p style="color:#9ca3af;font-size:12px;margin:0">
        All data from public App Store and Google Play listings · Not financial advice.<br>
        <strong>Do not share — contains private developer contact information.</strong>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
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
    throw new Error(`Resend ${res.status}: ${err}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Gumroad sends application/x-www-form-urlencoded
    const body = await req.text();
    const params = new URLSearchParams(body);

    // Optional: verify Gumroad secret (set "Ping URL webhook" secret in product settings)
    const receivedSecret = params.get('secret') || params.get('webhook_secret');
    if (WEBHOOK_SECRET && receivedSecret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyerEmail = params.get('email') || params.get('purchase_email');
    const buyerName = params.get('full_name') || '';
    const refunded = params.get('refunded') === 'true';

    if (refunded || !buyerEmail) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Load the latest report from the filesystem
    // On Vercel, private reports are in the app bundle
    const reportPath = path.join(process.cwd(), 'private', 'reports', 'latest-report.md');
    if (!fs.existsSync(reportPath)) {
      console.error('No report found at', reportPath);
      return NextResponse.json({ error: 'Report not found' }, { status: 500 });
    }

    const reportMd = fs.readFileSync(reportPath, 'utf8');
    const weekMatch = reportMd.match(/Week (\d+) Report/);
    const weekNum = weekMatch ? weekMatch[1] : 'Latest';

    const subject = `Your AppScout Week ${weekNum} Report — App Acquisition Opportunities`;
    const html = buildWelcomeEmail(buyerName, reportMd, weekNum);

    await sendEmail(buyerEmail, subject, html);
    console.log(`Report sent to new buyer: ${buyerEmail}`);

    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Gumroad webhook error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
