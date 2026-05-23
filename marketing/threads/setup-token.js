#!/usr/bin/env node
/**
 * setup-token.js
 * Prints the Threads authorization URL.
 * After you authorize, appscout-ai.vercel.app handles the token exchange
 * and shows you the token to paste into .env
 *
 * Usage:
 *   node setup-token.js          ← English account
 *   node setup-token.js --lang de ← German account
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const APP_ID = '2180495739438893';
const REDIRECT_URI = 'https://appscout-ai.vercel.app/api/threads-callback';
const SCOPES = 'threads_basic,threads_content_publish';
const ENV_FILE = path.join(__dirname, '.env');

const LANG = (process.argv.find((a, i) => process.argv[i - 1] === '--lang') || 'en').toLowerCase();
const IS_DE = LANG === 'de';
const LABEL = IS_DE ? 'German (DE)' : 'English (EN)';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); });
  });
}

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  const result = {};
  fs.readFileSync(ENV_FILE, 'utf8').split('\n').forEach((line) => {
    const eq = line.indexOf('=');
    if (eq > 0) result[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
  return result;
}

function saveEnv(updates) {
  const current = loadEnv();
  const merged = { ...current, ...updates };
  const lines = Object.entries(merged).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(ENV_FILE, lines.join('\n') + '\n', 'utf8');
}

async function main() {
  console.log(`\n🔐 AppScout Threads Setup — ${LABEL}`);
  console.log(`─────────────────────────────────\n`);

  const authURL = `https://threads.net/oauth/authorize?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES}&response_type=code`;

  console.log(`Step 1 — Open this URL in your browser:\n`);
  console.log(authURL);
  console.log(`\nStep 2 — Log in with your Threads account and click Allow.`);
  console.log(`\nStep 3 — You'll land on appscout-ai.vercel.app with your token shown on screen.`);
  console.log(`         Copy the THREADS_ACCESS_TOKEN and THREADS_USER_ID values.\n`);
  console.log(`Step 4 — Come back here and paste them:\n`);

  const token = await ask(`Paste THREADS_ACCESS_TOKEN: `);
  if (!token) { console.log('No token entered. Exiting.'); process.exit(1); }

  const userId = await ask(`Paste THREADS_USER_ID: `);
  if (!userId) { console.log('No user ID entered. Exiting.'); process.exit(1); }

  const tokenKey = IS_DE ? 'THREADS_ACCESS_TOKEN_DE' : 'THREADS_ACCESS_TOKEN';
  const userKey  = IS_DE ? 'THREADS_USER_ID_DE'      : 'THREADS_USER_ID';
  const enableKey = IS_DE ? 'THREADS_POSTING_ENABLED_DE' : 'THREADS_POSTING_ENABLED';

  saveEnv({ [tokenKey]: token, [userKey]: userId, [enableKey]: 'false' });

  console.log(`\n✅ Saved to .env`);
  console.log(`   ${tokenKey}=***`);
  console.log(`   ${userKey}=${userId}`);
  console.log(`   ${enableKey}=false\n`);
  console.log(`When ready to post, open .env and set ${enableKey}=true\n`);

  if (!IS_DE) {
    console.log(`For German account: node setup-token.js --lang de\n`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
