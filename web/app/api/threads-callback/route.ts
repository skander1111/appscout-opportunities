export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const APP_ID = process.env.THREADS_APP_ID || '2180495739438893';
const APP_SECRET = process.env.THREADS_APP_SECRET || '';
const REDIRECT_URI = 'https://appscout-ai.vercel.app/api/threads-callback';

async function post(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

async function get(url: string) {
  const res = await fetch(url);
  return res.json();
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return new NextResponse(errorPage(error), { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return new NextResponse(errorPage('No code received'), { headers: { 'Content-Type': 'text/html' } });
  }

  if (!APP_SECRET) {
    return new NextResponse(errorPage('THREADS_APP_SECRET not set in Vercel env vars'), { headers: { 'Content-Type': 'text/html' } });
  }

  // Exchange code for short-lived token
  const tokenRes = await post('https://graph.threads.net/oauth/access_token', {
    client_id: APP_ID,
    client_secret: APP_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  });

  if (tokenRes.error) {
    return new NextResponse(errorPage(`Token exchange failed: ${tokenRes.error.message}`), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const shortToken: string = tokenRes.access_token;
  const userId: string = String(tokenRes.user_id);

  // Exchange for long-lived token (60 days)
  const longRes = await get(
    `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&access_token=${shortToken}`
  );

  const finalToken: string = longRes.access_token || shortToken;
  const expiresInDays = longRes.expires_in ? Math.floor(longRes.expires_in / 86400) : 60;

  return new NextResponse(successPage(finalToken, userId, expiresInDays), {
    headers: { 'Content-Type': 'text/html' },
  });
}

function successPage(token: string, userId: string, days: number) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>AppScout — Threads Setup</title>
  <style>
    body { font-family: monospace; background: #0a0a0f; color: #e5e7eb; padding: 40px; max-width: 700px; margin: 0 auto; }
    h1 { color: #10b981; }
    .box { background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 20px; margin: 16px 0; }
    .label { color: #6b7280; font-size: 12px; margin-bottom: 6px; }
    .value { color: #f9fafb; word-break: break-all; font-size: 13px; }
    .copy-btn { background: #10b981; color: #000; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-family: monospace; margin-top: 8px; }
    .copy-btn:hover { background: #059669; }
    .step { color: #9ca3af; margin: 8px 0; }
    code { background: #1f2937; padding: 2px 6px; border-radius: 3px; color: #10b981; }
  </style>
</head>
<body>
  <h1>✅ Threads Authorized</h1>
  <p>Your access token is ready. Copy it into your <code>.env</code> file.</p>

  <div class="box">
    <div class="label">THREADS_ACCESS_TOKEN</div>
    <div class="value" id="token">${token}</div>
    <button class="copy-btn" onclick="copy('token', this)">Copy token</button>
  </div>

  <div class="box">
    <div class="label">THREADS_USER_ID</div>
    <div class="value" id="uid">${userId}</div>
    <button class="copy-btn" onclick="copy('uid', this)">Copy user ID</button>
  </div>

  <div class="box">
    <div class="label">Expires in</div>
    <div class="value">${days} days — re-run setup-token.js to refresh before expiry</div>
  </div>

  <p class="step">Paste these into <code>marketing/threads/.env</code>:</p>
  <div class="box">
    <div class="value">THREADS_ACCESS_TOKEN=${token}<br>THREADS_USER_ID=${userId}<br>THREADS_POSTING_ENABLED=false</div>
    <button class="copy-btn" onclick="copyBlock(this)">Copy .env block</button>
  </div>

  <p style="color:#6b7280; font-size:12px; margin-top:32px;">Close this tab when done. Do not share this page.</p>

  <script>
    function copy(id, btn) {
      navigator.clipboard.writeText(document.getElementById(id).textContent);
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    }
    function copyBlock(btn) {
      const text = "THREADS_ACCESS_TOKEN=${token}\\nTHREADS_USER_ID=${userId}\\nTHREADS_POSTING_ENABLED=false";
      navigator.clipboard.writeText("THREADS_ACCESS_TOKEN=${token}\nTHREADS_USER_ID=${userId}\nTHREADS_POSTING_ENABLED=false");
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy .env block', 2000);
    }
  </script>
</body>
</html>`;
}

function errorPage(msg: string) {
  return `<!DOCTYPE html>
<html>
<head><title>AppScout — Threads Setup Error</title>
<style>body{font-family:monospace;background:#0a0a0f;color:#e5e7eb;padding:40px;max-width:600px;margin:0 auto;}h1{color:#ef4444;}</style>
</head>
<body>
  <h1>❌ Setup Failed</h1>
  <p>${msg}</p>
  <p>Close this tab and try again.</p>
</body>
</html>`;
}
