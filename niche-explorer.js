import gplay from "google-play-scraper";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date();

// Niches chosen for high abandoned-app probability:
// Utility tools built 2013-2019 when Android market exploded → many devs quit
// Niche enough that big companies don't dominate → room for abandoned gems
const NICHES = [
  { term: "pdf", label: "PDF Tools" },
  { term: "converter", label: "Unit Converter" },
  { term: "flashcard", label: "Flashcards" },
  { term: "habit", label: "Habit Tracker" },
  { term: "expense", label: "Expense Tracker" },
  { term: "prayer", label: "Prayer Times" },
  { term: "qr scanner", label: "QR Scanner" },
  { term: "ringtone", label: "Ringtone Maker" },
  { term: "calorie", label: "Calorie Counter" },
  { term: "barcode", label: "Barcode Scanner" },
];

const APPS_PER_NICHE = 30;
const DETAIL_DELAY_MS = 1200;

// ── Scoring ──────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  if (!dateStr) return 9999;
  return Math.floor((today - new Date(dateStr)) / 86_400_000);
}

function demandScore(minInstalls) {
  if (!minInstalls) return 0;
  if (minInstalls >= 10_000_000) return 40;
  if (minInstalls >= 1_000_000) return 35;
  if (minInstalls >= 500_000) return 30;
  if (minInstalls >= 100_000) return 25;
  if (minInstalls >= 50_000) return 15;
  if (minInstalls >= 10_000) return 10;
  return 0;
}

function abandonmentScore(days) {
  if (days >= 365 * 3) return 40;
  if (days >= 365 * 2) return 35;
  if (days >= 365) return 25;
  if (days >= 180) return 10;
  return 0;
}

function ratingScore(score) {
  if (!score) return 0;
  if (score < 3.0) return -15;
  if (score <= 4.1) return 20;
  if (score <= 4.4) return 10;
  return 0;
}

function reachabilityScore(email) {
  return email ? 10 : -10;
}

function monetizationScore(app) {
  let s = 0;
  if (app.offersIAP) s += 10;
  if (app.adSupported) s += 5;
  if (app.free) s += 5;
  return s;
}

function riskScore(app, days) {
  let r = 0;
  if ((app.minInstalls || 0) < 10_000) r += 15;
  if (!app.developerEmail) r += 10;
  if (app.score && app.score < 3.0) r += 15;
  if (days < 180) r += 20;
  return r;
}

function classify(score) {
  if (score >= 75) return "Strong";
  if (score >= 55) return "Possible";
  if (score >= 35) return "Weak";
  return "Ignore";
}

function acquireOrRebuild(app, days) {
  // Acquisition signal: high installs + developer reachable + not dead rating
  if (
    app.minInstalls >= 100_000 &&
    app.developerEmail &&
    days >= 365 &&
    app.score >= 3.0
  ) {
    return "Acquisition candidate";
  }
  // Rebuild signal: demand proven but app is too broken or unreachable
  if (app.minInstalls >= 50_000 && days >= 365) {
    return "Rebuild opportunity";
  }
  return "Skip";
}

function scoreApp(app, niche) {
  const days = daysSince(app.updatedDate);
  const demand = demandScore(app.minInstalls);
  const abandonment = abandonmentScore(days);
  const rating = ratingScore(app.score);
  const reachability = reachabilityScore(app.developerEmail);
  const monetization = monetizationScore(app);
  const risk = riskScore(app, days);
  const opportunityScore =
    demand + abandonment + rating + reachability + monetization - risk;

  return {
    niche,
    title: app.title,
    appId: app.appId,
    developer: app.developer,
    developerEmail: app.developerEmail || null,
    installs: app.installs,
    minInstalls: app.minInstalls,
    score: app.score,
    ratings: app.ratings,
    reviews: app.reviews,
    updatedDate: app.updatedDate,
    released: app.released,
    daysSinceUpdate: days,
    free: app.free,
    offersIAP: app.offersIAP,
    adSupported: app.adSupported,
    url: app.url,
    opportunityScore,
    classification: classify(opportunityScore),
    strategy: acquireOrRebuild(app, days),
    scoring: { demand, abandonment, rating, reachability, monetization, risk },
  };
}

// ── Niche stats ───────────────────────────────────────────────────────────────

function nicheStats(apps) {
  const total = apps.length;
  if (total === 0) return null;

  const avgDays = Math.round(
    apps.reduce((s, a) => s + a.daysSinceUpdate, 0) / total
  );
  const avgScore = Math.round(
    apps.reduce((s, a) => s + a.opportunityScore, 0) / total
  );
  const strong = apps.filter((a) => a.classification === "Strong").length;
  const possible = apps.filter((a) => a.classification === "Possible").length;
  const acquisitions = apps.filter(
    (a) => a.strategy === "Acquisition candidate"
  ).length;
  const rebuilds = apps.filter(
    (a) => a.strategy === "Rebuild opportunity"
  ).length;
  const pctAbandoned = Math.round(
    (apps.filter((a) => a.daysSinceUpdate >= 365).length / total) * 100
  );
  const bestApp = apps.sort((a, b) => b.opportunityScore - a.opportunityScore)[0];

  return {
    total,
    avgDaysSinceUpdate: avgDays,
    avgOpportunityScore: avgScore,
    pctAbandoned,
    strongOpportunities: strong,
    possibleOpportunities: possible,
    acquisitionCandidates: acquisitions,
    rebuildOpportunities: rebuilds,
    bestApp: bestApp.title,
    bestScore: bestApp.opportunityScore,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const seen = new Set();
  const allApps = [];
  const nicheResults = {};

  for (const niche of NICHES) {
    console.log(`\n[${niche.label}] Searching...`);

    let searchResults;
    try {
      searchResults = await gplay.search({
        term: niche.term,
        num: APPS_PER_NICHE,
        lang: "en",
        country: "us",
      });
    } catch (err) {
      console.log(`  Search failed: ${err.message}`);
      continue;
    }

    const nicheApps = [];

    for (const result of searchResults) {
      if (seen.has(result.appId)) continue;
      seen.add(result.appId);

      try {
        process.stdout.write(`  → ${result.title.substring(0, 40)}...`);
        const details = await gplay.app({
          appId: result.appId,
          lang: "en",
          country: "us",
        });

        const scored = scoreApp(
          {
            title: details.title,
            appId: details.appId,
            url: details.url,
            developer: details.developer,
            developerEmail: details.developerEmail || null,
            installs: details.installs,
            minInstalls: details.minInstalls,
            score: details.score,
            ratings: details.ratings,
            reviews: details.reviews,
            updatedDate: details.updated
              ? new Date(details.updated).toISOString().split("T")[0]
              : null,
            released: details.released,
            free: details.free,
            offersIAP: details.offersIAP,
            adSupported: details.adSupported,
          },
          niche.label
        );

        console.log(` [${scored.opportunityScore}pts / ${scored.classification}]`);
        nicheApps.push(scored);
        allApps.push(scored);

        await sleep(DETAIL_DELAY_MS);
      } catch (err) {
        console.log(` SKIP (${err.message})`);
      }
    }

    nicheResults[niche.label] = {
      apps: nicheApps,
      stats: nicheStats([...nicheApps]),
    };
  }

  // ── Save all scored apps ────────────────────────────────────────────────────
  const sorted = [...allApps].sort(
    (a, b) => b.opportunityScore - a.opportunityScore
  );
  fs.writeFileSync("all-scored-apps.json", JSON.stringify(sorted, null, 2));

  // ── Save niche comparison ───────────────────────────────────────────────────
  const nicheComparison = Object.entries(nicheResults)
    .filter(([, data]) => data.stats !== null)
    .map(([label, data]) => ({ niche: label, ...data.stats }))
    .sort((a, b) => b.avgOpportunityScore - a.avgOpportunityScore);

  fs.writeFileSync(
    "niche-comparison.json",
    JSON.stringify(nicheComparison, null, 2)
  );

  // ── Console report ──────────────────────────────────────────────────────────
  console.log("\n\n════════════════════════════════════════════════════════");
  console.log("  NICHE COMPARISON — ranked by avg opportunity score");
  console.log("════════════════════════════════════════════════════════\n");
  console.table(
    nicheComparison.map((n) => ({
      niche: n.niche,
      apps: n.total,
      "avg score": n.avgOpportunityScore,
      "% abandoned": `${n.pctAbandoned}%`,
      "avg days old": n.avgDaysSinceUpdate,
      strong: n.strongOpportunities,
      possible: n.possibleOpportunities,
      acquire: n.acquisitionCandidates,
      rebuild: n.rebuildOpportunities,
      "best app": n.bestApp?.substring(0, 25),
    }))
  );

  console.log("\n\n════════════════════════════════════════════════════════");
  console.log("  TOP 15 APPS ACROSS ALL NICHES");
  console.log("════════════════════════════════════════════════════════\n");
  console.table(
    sorted.slice(0, 15).map((a) => ({
      title: a.title.substring(0, 28),
      niche: a.niche,
      installs: a.installs,
      rating: a.score ? a.score.toFixed(2) : "N/A",
      "days old": a.daysSinceUpdate,
      score: a.opportunityScore,
      class: a.classification,
      strategy: a.strategy,
    }))
  );

  console.log(
    `\nSaved: all-scored-apps.json (${sorted.length} apps) | niche-comparison.json\n`
  );
}

main().catch(console.error);
