#!/usr/bin/env node
/**
 * generateThreadsPosts.js
 * Generates Threads post drafts based on day of week.
 * Fetches live AppScout data for real examples.
 * Saves to threads-drafts.md — never posts directly.
 *
 * Schedule:
 *   Friday    → weekly_report
 *   Monday    → opportunity_insight
 *   Wednesday → rebuild_partner
 *   Sunday    → building_in_public
 *
 * Usage:
 *   node generateThreadsPosts.js [--dry-run] [--lang en|de] [--type weekly_report|opportunity_insight|rebuild_partner|building_in_public]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DRAFTS_FILE = path.join(__dirname, 'threads-drafts.md');
const LOG_FILE = path.join(__dirname, 'threads-log.json');
const API_BASE = 'https://appscout-ai.vercel.app';
const THREADS_MAX_CHARS = 500;

const DRY_RUN = process.argv.includes('--dry-run');
const typeArg = process.argv.find((a, i) => process.argv[i - 1] === '--type');
const langArg = (process.argv.find((a, i) => process.argv[i - 1] === '--lang') || 'en').toLowerCase();
const LANG = langArg === 'de' ? 'de' : 'en';

// ── Helpers ───────────────────────────────────────────────────────────

function dayToPostType(day) {
  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const map = { 5: 'weekly_report', 1: 'opportunity_insight', 3: 'rebuild_partner', 0: 'building_in_public' };
  return map[day] || null;
}

function loadLog() {
  if (!fs.existsSync(LOG_FILE)) return [];
  return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
}

function appendLog(entry) {
  const log = loadLog();
  log.push({ ...entry, timestamp: new Date().toISOString() });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
}

function postedTodayType() {
  const log = loadLog();
  const today = new Date().toISOString().split('T')[0];
  const entry = log.find((e) => e.action === 'generated' && e.timestamp.startsWith(today));
  return entry ? entry.postType : null;
}

function fetchData(path) {
  return new Promise((resolve) => {
    https.get(`${API_BASE}${path}`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

function formatInstalls(n) {
  if (!n) return 'millions of';
  if (n >= 50_000_000) return '50M+';
  if (n >= 10_000_000) return '10M+';
  if (n >= 5_000_000) return '5M+';
  if (n >= 1_000_000) return '1M+';
  if (n >= 500_000) return '500K+';
  if (n >= 100_000) return '100K+';
  return `${Math.round(n / 1000)}K+`;
}

function truncate(text) {
  if (text.length <= THREADS_MAX_CHARS) return text;
  return text.slice(0, THREADS_MAX_CHARS - 3) + '...';
}

// ── Post Generators ───────────────────────────────────────────────────

function generateWeeklyReport(apps, meta) {
  const count = meta?.count || apps?.length || 54;
  const top = apps?.[0];
  const topLine = top
    ? `Top find: ${top.name || 'An app'} — ${formatInstalls(top.installs)} installs, ${top.daysSinceUpdate || '400'}d abandoned, score ${top.score || 90}/100.`
    : `Top score this week: 95/100.`;

  const week = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 604_800_000);

  return truncate(
`Week ${week} AppScout report is live.

${count} qualified opportunities found this week.
${topLine}

Developer emails, outreach drafts, and risk scores in the full report.

→ appscout-ai.vercel.app`
  );
}

function generateOpportunityInsight(apps) {
  const app = apps?.[0];

  if (app) {
    const name = app.name || 'A productivity app';
    const installs = formatInstalls(app.installs);
    const days = app.daysSinceUpdate || 421;
    const score = app.score || 90;
    const niche = app.niche || 'utility';

    return truncate(
`${name}.

${installs} installs on Google Play.
Last updated: ${days} days ago.
Niche: ${niche}.
Score: ${score}/100.

The developer moved on. The users didn't.

That gap — between abandoned and forgotten — is where the deal is.

→ appscout-ai.vercel.app/dashboard`
    );
  }

  // Fallback if API is down
  const fallbacks = [
    `An app with 5M installs.
Last update: 421 days ago.
Score: 90/100.

The developer got a new job.
The app still gets 40,000 downloads a month.

Nobody has emailed them yet.

→ appscout-ai.vercel.app/dashboard`,

    `100,000 installs.
3,149 days since the last update.

That's 8.6 years of abandonment.

Still ranking. Still getting installs.
Developer email: public.

→ appscout-ai.vercel.app`,

    `The Oxford Dictionary app has 50M+ installs.
Last updated 211 days ago.

Not everything that stops moving is dead.
Some things just need someone who cares.

→ appscout-ai.vercel.app/dashboard`,
  ];

  const log = loadLog();
  const usedFallbacks = new Set(log.filter((e) => e.postType === 'opportunity_insight').map((e) => e.fallbackIndex));
  const idx = [0, 1, 2].find((i) => !usedFallbacks.has(i)) ?? 0;

  return truncate(fallbacks[idx]);
}

function generateRebuildPartner(apps) {
  const rebuildApps = apps?.filter((a) =>
    (a.classification || '').toLowerCase().includes('rebuild') ||
    (a.daysSinceUpdate || 0) < 365
  );
  const app = rebuildApps?.[0] || apps?.[0];

  if (app) {
    const name = app.name || 'A quiz app';
    const installs = formatInstalls(app.installs);
    const days = app.daysSinceUpdate || 280;

    return truncate(
`${name}. ${installs} installs. ${days} days since the last update.

Not abandoned enough to buy outright.
But the 1-star reviews tell the story:
crashes, outdated UI, no response from the developer.

The demand is proven. The execution broke.

That's a rebuild play — not an acquisition.
Build a better version. Capture the same audience.

→ appscout-ai.vercel.app/dashboard`
    );
  }

  const fallbacks = [
    `The best app to build in 2026:

One that already exists.
Already ranked. Already has users.
Developer just stopped updating it.

You're not building from zero.
You're taking over.

→ appscout-ai.vercel.app`,

    `Found a meditation app this week.
1M+ installs. 536 days abandoned.
Top review: "Used to be great, crashes constantly now."

That's not a dead app.
That's a broken one.

The audience is still there — waiting for someone to fix it.

→ appscout-ai.vercel.app/dashboard`,

    `Partner opportunity this week:

Developer posted on Reddit:
"Looking to sell my app for around $4,000"
0 replies. 10 days ago.

That's not a listing.
That's a conversation nobody started.

→ appscout-ai.vercel.app`,
  ];

  const log = loadLog();
  const used = new Set(log.filter((e) => e.postType === 'rebuild_partner').map((e) => e.fallbackIndex));
  const idx = [0, 1, 2].find((i) => !used.has(i)) ?? 0;

  return truncate(fallbacks[idx]);
}

function generateBuildingInPublic() {
  const updates = [
    `Building AppScout in public.

This week:
→ 247 apps scanned across 19 niches
→ 54 qualified opportunities surfaced
→ 100% developer contact found

The hardest part isn't finding the apps.
It's convincing people that off-market deals exist.

They do.`,

    `Something I didn't expect when building AppScout:

The apps with the most installs are sometimes the easiest to acquire.

Because the developer is long gone.
The audience is self-sustaining.
Nobody else is looking.

The size doesn't scare buyers away. It should attract them.`,

    `AppScout week 2 update.

Added 4 new niches this week: Compass, Flashlight, Bible, Unit Converter.

Boring niches. Serious install counts.
A flashlight app with 10M installs and no updates in 3 years is not boring.

It's an asset.`,

    `Why I built AppScout:

I kept reading about people buying apps on Flippa and paying 3–5x what they'd pay if they'd just emailed the developer directly.

The deals are the same. The competition isn't.

Off-market means: no auction, no listing fee, no competing bids.`,

    `Honest update on AppScout:

The scoring algorithm is not perfect.
Some 90-score apps are not worth buying.
Some 70-score apps are great deals.

I'm improving it.
But the signal is real — abandoned + installs + reachable developer = opportunity.

→ appscout-ai.vercel.app`,
  ];

  const log = loadLog();
  const used = new Set(log.filter((e) => e.postType === 'building_in_public').map((e) => e.fallbackIndex));
  const idx = [0, 1, 2, 3, 4].find((i) => !used.has(i)) ?? 0;

  return truncate(updates[idx]);
}

// ── German Post Generators (DACH market) ─────────────────────────────

function generateWeeklyReportDE(apps, meta) {
  const count = meta?.count || apps?.length || 54;
  const top = apps?.[0];
  const topLine = top
    ? `Top-Fund: ${top.name || 'Eine App'} — ${formatInstalls(top.installs)} Installs, ${top.daysSinceUpdate || '400'} Tage ohne Update, Score ${top.score || 90}/100.`
    : `Höchster Score diese Woche: 95/100.`;
  const week = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 604_800_000);

  return truncate(
`AppScout Wochenbericht — KW ${week} ist live.

${count} qualifizierte App-Chancen diese Woche.
${topLine}

Entwickler-Kontakt, Bewertungsanalyse und Outreach-Vorlagen im vollständigen Bericht.

→ appscout-ai.vercel.app`
  );
}

function generateOpportunityInsightDE(apps) {
  const app = apps?.[0];

  if (app) {
    const name = app.name || 'Eine Produktivitäts-App';
    const installs = formatInstalls(app.installs);
    const days = app.daysSinceUpdate || 421;
    const score = app.score || 90;
    const niche = app.niche || 'Utility';

    return truncate(
`${name}.

${installs} Installs auf Google Play.
Letztes Update: vor ${days} Tagen.
Kategorie: ${niche}.
Score: ${score}/100.

Der Entwickler ist weitergezogen. Die Nutzer nicht.

Diese Lücke — zwischen aufgegeben und vergessen — ist die Chance.

→ appscout-ai.vercel.app/dashboard`
    );
  }

  const fallbacks = [
    `Eine App mit 5 Millionen Installs.
Letztes Update: vor 421 Tagen.
Score: 90/100.

Der Entwickler hat einen neuen Job.
Die App lädt noch immer 40.000 Mal pro Monat herunter.

Noch hat sie niemand kontaktiert.

→ appscout-ai.vercel.app/dashboard`,

    `100.000 Installs.
3.149 Tage seit dem letzten Update.

Das sind 8,6 Jahre Stillstand.

Wird noch gefunden. Lädt noch runter.
E-Mail des Entwicklers: öffentlich.

→ appscout-ai.vercel.app`,

    `Das Oxford Dictionary hat 50M+ Installs.
Letztes Update: vor 211 Tagen.

Nicht alles, was aufgehört hat sich zu bewegen, ist tot.
Manche Dinge brauchen nur jemanden, dem es wichtig ist.

→ appscout-ai.vercel.app/dashboard`,
  ];

  const log = loadLog();
  const used = new Set(log.filter((e) => e.postType === 'opportunity_insight' && e.lang === 'de').map((e) => e.fallbackIndex));
  const idx = [0, 1, 2].find((i) => !used.has(i)) ?? 0;
  return truncate(fallbacks[idx]);
}

function generateRebuildPartnerDE(apps) {
  const app = apps?.find((a) => (a.classification || '').toLowerCase().includes('rebuild')) || apps?.[0];

  if (app) {
    const name = app.name || 'Eine Quiz-App';
    const installs = formatInstalls(app.installs);
    const days = app.daysSinceUpdate || 280;

    return truncate(
`${name}. ${installs} Installs. ${days} Tage ohne Update.

Nicht lange genug aufgegeben für eine direkte Übernahme.
Aber die 1-Stern-Bewertungen erzählen die Geschichte:
Abstürze, veraltetes Design, kein Support.

Die Nachfrage ist bewiesen. Die Umsetzung ist kaputt.

Das ist kein Kauf — das ist ein Rebuild.
Bessere Version bauen. Dieselbe Zielgruppe übernehmen.

→ appscout-ai.vercel.app/dashboard`
    );
  }

  const fallbacks = [
    `Die beste App für 2026 zu bauen:

Eine, die es bereits gibt.
Bereits gerankt. Bereits mit Nutzern.
Der Entwickler hat nur aufgehört, sie zu pflegen.

Kein Neustart von null.
Übernahme eines bestehenden Publikums.

→ appscout-ai.vercel.app`,

    `Eine Meditations-App diese Woche gefunden.
1M+ Installs. 536 Tage aufgegeben.
Top-Bewertung: "War früher super, stürzt jetzt ständig ab."

Das ist keine tote App.
Das ist eine kaputte.

Die Nutzer sind noch da — und warten darauf, dass jemand es repariert.

→ appscout-ai.vercel.app/dashboard`,

    `Partner-Chance diese Woche:

Entwickler hat auf Reddit gepostet:
"Möchte meine App für ca. 4.000 € verkaufen"
0 Antworten. Vor 10 Tagen.

Das ist keine Ausschreibung.
Das ist ein Gespräch, das noch niemand begonnen hat.

→ appscout-ai.vercel.app`,
  ];

  const log = loadLog();
  const used = new Set(log.filter((e) => e.postType === 'rebuild_partner' && e.lang === 'de').map((e) => e.fallbackIndex));
  const idx = [0, 1, 2].find((i) => !used.has(i)) ?? 0;
  return truncate(fallbacks[idx]);
}

function generateBuildingInPublicDE() {
  const updates = [
    `AppScout — Aufbau in der Öffentlichkeit.

Diese Woche:
→ 247 Apps in 19 Kategorien analysiert
→ 54 qualifizierte Chancen gefunden
→ 100 % der Entwickler erreichbar

Das Schwierigste ist nicht, die Apps zu finden.
Es ist, Menschen davon zu überzeugen, dass Off-Market-Deals existieren.

Sie existieren.`,

    `Was mich beim Aufbau von AppScout überrascht hat:

Apps mit den meisten Installs sind manchmal am einfachsten zu übernehmen.

Der Entwickler ist längst weg.
Die Nutzer halten die App am Leben.
Niemand sonst schaut hin.

Die Größe sollte Käufer anziehen — nicht abschrecken.`,

    `AppScout — Update KW 21.

Vier neue Kategorien hinzugefügt: Kompass, Taschenlampe, Bibel, Einheitenrechner.

Langweilige Kategorien. Ernsthafte Nutzerzahlen.
Eine Taschenlampen-App mit 10M Installs und 3 Jahren ohne Update ist nicht langweilig.

Das ist ein Asset.`,

    `Warum ich AppScout gebaut habe:

Ich habe immer wieder gelesen, wie Menschen Apps auf Flippa kaufen und 3–5× mehr zahlen, als wenn sie den Entwickler direkt kontaktiert hätten.

Die Deals sind dieselben. Der Wettbewerb nicht.

Off-Market bedeutet: keine Auktion, keine Plattformgebühr, keine Konkurrenzgebote.`,

    `Ehrliches AppScout-Update:

Der Scoring-Algorithmus ist nicht perfekt.
Manche 90-Punkte-Apps sind den Preis nicht wert.
Manche 70-Punkte-Apps sind großartige Deals.

Ich verbessere es kontinuierlich.
Aber das Signal ist real — aufgegeben + Installs + erreichbarer Entwickler = Chance.

→ appscout-ai.vercel.app`,
  ];

  const log = loadLog();
  const used = new Set(log.filter((e) => e.postType === 'building_in_public' && e.lang === 'de').map((e) => e.fallbackIndex));
  const idx = [0, 1, 2, 3, 4].find((i) => !used.has(i)) ?? 0;
  return truncate(updates[idx]);
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const day = new Date().getDay();
  const postType = typeArg || dayToPostType(day);

  console.log(`\n🧵 AppScout Threads Post Generator`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Lang: ${LANG.toUpperCase()}`);
  console.log(`Day: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]}`);
  console.log(`Post type: ${postType || 'none scheduled today'}\n`);

  if (!postType) {
    console.log(`No post scheduled for today (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]}).`);
    console.log(`Scheduled days: Friday (weekly_report), Monday (opportunity_insight), Wednesday (rebuild_partner), Sunday (building_in_public)`);
    console.log(`Force with: node generateThreadsPosts.js --type <type>\n`);
    process.exit(0);
  }

  if (postedTodayType() && !DRY_RUN) {
    console.log(`✓ Already generated a post today. Check threads-drafts.md.\n`);
    process.exit(0);
  }

  console.log(`Fetching live data...`);
  const apps = await fetchData('/api/opportunities?limit=5');
  const appList = Array.isArray(apps) ? apps : [];
  console.log(`Got ${appList.length} live apps.\n`);

  let text;
  let fallbackIndex = null;

  const isDE = LANG === 'de';

  switch (postType) {
    case 'weekly_report':
      text = isDE
        ? generateWeeklyReportDE(appList, { count: appList.length || 54 })
        : generateWeeklyReport(appList, { count: appList.length || 54 });
      break;
    case 'opportunity_insight':
      text = isDE ? generateOpportunityInsightDE(appList) : generateOpportunityInsight(appList);
      if (!appList.length) {
        const log = loadLog();
        const used = new Set(log.filter((e) => e.postType === 'opportunity_insight' && e.lang === LANG).map((e) => e.fallbackIndex));
        fallbackIndex = [0, 1, 2].find((i) => !used.has(i)) ?? 0;
      }
      break;
    case 'rebuild_partner':
      text = isDE ? generateRebuildPartnerDE(appList) : generateRebuildPartner(appList);
      if (!appList.length) {
        const log = loadLog();
        const used = new Set(log.filter((e) => e.postType === 'rebuild_partner' && e.lang === LANG).map((e) => e.fallbackIndex));
        fallbackIndex = [0, 1, 2].find((i) => !used.has(i)) ?? 0;
      }
      break;
    case 'building_in_public':
      text = isDE ? generateBuildingInPublicDE() : generateBuildingInPublic();
      {
        const log = loadLog();
        const used = new Set(log.filter((e) => e.postType === 'building_in_public' && e.lang === LANG).map((e) => e.fallbackIndex));
        fallbackIndex = [0, 1, 2, 3, 4].find((i) => !used.has(i)) ?? 0;
      }
      break;
    default:
      console.log(`Unknown post type: ${postType}\n`);
      process.exit(1);
  }

  console.log(`── Post Preview (${text.length}/${THREADS_MAX_CHARS} chars) ──────────────────\n`);
  console.log(text);
  console.log(`\n──────────────────────────────────────────────────`);

  if (DRY_RUN) {
    console.log(`\nDry run complete. No files written.\n`);
    return;
  }

  const entry = {
    id: Date.now(),
    postType,
    lang: LANG,
    text,
    charCount: text.length,
    status: 'draft',
    generatedAt: new Date().toISOString(),
    postedAt: null,
    fallbackIndex,
  };

  // Save draft
  const block = `
---

## [${LANG.toUpperCase()}] ${postType.replace(/_/g, ' ').toUpperCase()} — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

**Status:** draft
**Type:** ${postType}
**Chars:** ${text.length}/${THREADS_MAX_CHARS}
**ID:** ${entry.id}

\`\`\`
${text}
\`\`\`

`;
  fs.appendFileSync(DRAFTS_FILE, block, 'utf8');

  // Save to log
  appendLog({ action: 'generated', ...entry });

  // Save pending post for publisher (lang-specific file)
  const pendingFile = path.join(__dirname, LANG === 'de' ? 'pending-post-de.json' : 'pending-post.json');
  fs.writeFileSync(pendingFile, JSON.stringify(entry, null, 2), 'utf8');

  console.log(`\n✅ Draft saved to threads-drafts.md`);
  console.log(`   ID: ${entry.id}`);
  console.log(`\n→ To publish: node threadsPublisher.js --id ${entry.id}`);
  console.log(`→ Dry run:    node threadsPublisher.js --id ${entry.id} --dry-run\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
