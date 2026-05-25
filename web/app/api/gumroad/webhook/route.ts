/**
 * POST /api/gumroad/webhook
 * Gumroad calls this on every new sale.
 *
 * What it does:
 *   1. Verifies the Gumroad-supplied secret (if GUMROAD_WEBHOOK_SECRET is set).
 *   2. Maps the purchased product to an AppScout tier (report / monthly / yearly).
 *   3. Issues a new license code, sets the expiry window for that tier.
 *   4. Emails the buyer their license code + activation link (and optionally the latest report).
 *
 * Env vars:
 *   GUMROAD_WEBHOOK_SECRET   — recommended. Reject requests with a mismatched secret.
 *   GUMROAD_PRODUCT_MAP      — optional. JSON: { "<product_permalink>": "report"|"monthly"|"yearly" }
 *                              Falls back to price-based tier detection if not set.
 *   APPSCOUT_BASE_URL        — public base URL, e.g. "https://appscout-ai.vercel.app"
 *   RESEND_API_KEY           — optional. If missing we just log; the license is still issued.
 *   FROM_EMAIL               — sender name & address used by Resend.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { issueLicense, type LicenseTier, TIER_CONFIG } from '@/lib/license';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'AppScout <noreply@appscout.io>';
const WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET;
const BASE_URL = process.env.APPSCOUT_BASE_URL || process.env.NEXT_PUBLIC_URL || 'https://appscout-ai.vercel.app';

function tierFromGumroad(params: URLSearchParams): LicenseTier | null {
  // 1. Explicit mapping by permalink (most reliable once you create 3 separate Gumroad products).
  try {
    if (process.env.GUMROAD_PRODUCT_MAP) {
      const map = JSON.parse(process.env.GUMROAD_PRODUCT_MAP) as Record<string, LicenseTier>;
      const permalink = params.get('permalink') || params.get('short_product_id') || params.get('product_permalink');
      if (permalink && map[permalink]) return map[permalink];
    }
  } catch {}

  // 2. Mapping by variant name (if one product has 3 variants).
  const variant = (params.get('variants[Tier]') || params.get('variants') || '').toLowerCase();
  if (variant.includes('yearly') || variant.includes('year')) return 'yearly';
  if (variant.includes('monthly') || variant.includes('month')) return 'monthly';
  if (variant.includes('day') || variant.includes('one')) return 'report';

  // 3. Fall back to price detection (Gumroad reports price in cents).
  const cents = parseInt(params.get('price') || '0');
  if (cents >= 10000) return 'yearly';   // $100+
  if (cents >= 1500)  return 'monthly';  // $15+
  if (cents >= 500)   return 'report';   // $5+

  return null;
}

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

function buildLicenseEmail(buyerName: string, code: string, tier: LicenseTier, activateUrl: string, reportHtml?: string): string {
  const cfg = TIER_CONFIG[tier];
  const tierName = { report: 'Day Pass', monthly: 'Monthly', yearly: 'Yearly' }[tier];

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,'Segoe UI',sans-serif;background:#050508;color:#f0f0f0;margin:0;padding:24px">
  <div style="max-width:640px;margin:0 auto;background:#0a0a10;border:1px solid #1a1a26;border-radius:14px;overflow:hidden">

    <div style="background:linear-gradient(135deg,#00ff88,#00cc6a);padding:28px;text-align:center">
      <div style="font-size:24px;font-weight:800;color:#000;letter-spacing:-0.5px">AppScout</div>
      <div style="color:#003a1a;margin-top:6px;font-size:13px;font-weight:600">${tierName} access · ${cfg.quota.toLocaleString()} AI calls</div>
    </div>

    <div style="padding:28px 32px;color:#d4d4d8">
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
        Hey${buyerName ? ` ${buyerName}` : ''} — thank you for your purchase.
      </p>

      <div style="background:#070709;border:1px solid #1a1a26;border-radius:10px;padding:20px;margin:20px 0">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#71717a;margin-bottom:8px">Your license code</div>
        <div style="font-family:Monaco,Consolas,monospace;font-size:22px;font-weight:700;color:#00ff88;letter-spacing:2px;text-align:center;padding:8px 0">
          ${code}
        </div>
      </div>

      <div style="text-align:center;margin:24px 0">
        <a href="${activateUrl}" style="display:inline-block;background:linear-gradient(135deg,#00ff88,#00cc6a);color:#000;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px">Activate now →</a>
      </div>

      <p style="font-size:13px;line-height:1.6;color:#a1a1aa">
        Or paste the code at <a href="${BASE_URL}/activate" style="color:#00ff88;text-decoration:none">${BASE_URL.replace(/^https?:\/\//,'')}/activate</a>.
      </p>

      <div style="border-top:1px solid #1a1a26;margin:28px 0 16px;padding-top:16px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#71717a;margin-bottom:10px">What you get</div>
        <ul style="font-size:13px;color:#d4d4d8;line-height:1.7;padding-left:18px;margin:0">
          <li>${cfg.hours}-hour access from activation</li>
          <li>${cfg.quota.toLocaleString()} AI calls (predict, search, ROI, deep dive, profile match)</li>
          <li>Full prediction layer + outreach drafts + due diligence</li>
          <li>Developer contacts unblurred · full opportunity feed</li>
        </ul>
      </div>

      ${reportHtml ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #1a1a26">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#71717a;margin-bottom:14px">This week's intelligence report</div>
        <div style="background:#fafafa;color:#1f2937;border-radius:8px;padding:20px;font-family:-apple-system,sans-serif">${reportHtml}</div>
      </div>` : ''}

    </div>

    <div style="background:#050508;padding:18px 32px;border-top:1px solid #1a1a26;text-align:center">
      <p style="color:#52525b;font-size:11px;margin:0;line-height:1.5">
        Your license expires automatically — no auto-renew, no surprise charges.<br>
        Questions? Reply to this email.
      </p>
    </div>
  </div>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) {
    console.warn(`[gumroad-webhook] RESEND_API_KEY not set — email skipped. To: ${to} / Subject: ${subject}`);
    return { skipped: true };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return { sent: true };
}

export async function POST(req: NextRequest) {
  try {
    // Gumroad sends application/x-www-form-urlencoded
    const body = await req.text();
    const params = new URLSearchParams(body);

    // Verify Gumroad secret if configured
    const receivedSecret = params.get('secret') || params.get('webhook_secret');
    if (WEBHOOK_SECRET && receivedSecret !== WEBHOOK_SECRET) {
      console.warn('[gumroad-webhook] secret mismatch — rejected');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyerEmail = params.get('email') || params.get('purchase_email');
    const buyerName = params.get('full_name') || '';
    const refunded = params.get('refunded') === 'true';
    const saleId = params.get('sale_id') || params.get('order_number') || '';

    if (refunded || !buyerEmail) {
      return NextResponse.json({ ok: true, skipped: true, reason: refunded ? 'refunded' : 'no email' });
    }

    const tier = tierFromGumroad(params);
    if (!tier) {
      console.error('[gumroad-webhook] could not determine tier; params:', Object.fromEntries(params));
      return NextResponse.json({ error: 'could not determine tier from purchase' }, { status: 400 });
    }

    // Issue the license
    const license = issueLicense(tier, {
      email: buyerEmail,
      source: `gumroad:${saleId || params.get('permalink') || 'unknown'}`,
    });
    const activateUrl = `${BASE_URL}/activate?code=${encodeURIComponent(license.code)}`;
    console.log(`[gumroad-webhook] issued ${tier} license ${license.code} for ${buyerEmail}`);

    // Optionally include the latest weekly report inline (for day-pass and above)
    let reportHtml: string | undefined;
    try {
      const reportPath = path.join(process.cwd(), 'private', 'reports', 'latest-report.md');
      if (fs.existsSync(reportPath)) {
        const md = fs.readFileSync(reportPath, 'utf8');
        reportHtml = markdownToHtml(md);
      }
    } catch {}

    const subject = `AppScout ${tier === 'yearly' ? 'Yearly' : tier === 'monthly' ? 'Monthly' : 'Day Pass'} — your license code`;
    const html = buildLicenseEmail(buyerName, license.code, tier, activateUrl, reportHtml);
    const result = await sendEmail(buyerEmail, subject, html);

    return NextResponse.json({
      ok: true,
      tier,
      code: license.code,
      activateUrl,
      delivered: !result.skipped,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[gumroad-webhook] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
