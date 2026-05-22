import fs from "fs";

const apps = JSON.parse(fs.readFileSync("apps-detailed.json", "utf-8"));
const today = new Date();

function daysSince(dateStr) {
  if (!dateStr) return 9999;
  return Math.floor((today - new Date(dateStr)) / (1000 * 60 * 60 * 24));
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
  if (score >= 75) return "Strong opportunity";
  if (score >= 55) return "Possible opportunity";
  if (score >= 35) return "Weak opportunity";
  return "Ignore";
}

const scored = apps.map((app) => {
  const days = daysSince(app.updatedDate);
  const demand = demandScore(app.minInstalls);
  const abandonment = abandonmentScore(days);
  const rating = ratingScore(app.score);
  const reachability = reachabilityScore(app.developerEmail);
  const monetization = monetizationScore(app);
  const risk = riskScore(app, days);
  const opportunityScore = demand + abandonment + rating + reachability + monetization - risk;

  return {
    title: app.title,
    appId: app.appId,
    developer: app.developer,
    developerEmail: app.developerEmail,
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
    recentChanges: app.recentChanges,
    url: app.url,
    scoring: { demand, abandonment, rating, reachability, monetization, risk },
    opportunityScore,
    classification: classify(opportunityScore),
  };
});

scored.sort((a, b) => b.opportunityScore - a.opportunityScore);

fs.writeFileSync("scored-apps.json", JSON.stringify(scored, null, 2));

const top10 = scored.slice(0, 10).map((a) => ({
  title: a.title.substring(0, 30),
  installs: a.installs,
  rating: a.score ? a.score.toFixed(2) : "N/A",
  updatedDate: a.updatedDate,
  daysSinceUpdate: a.daysSinceUpdate,
  opportunityScore: a.opportunityScore,
  classification: a.classification,
}));

console.log("\n=== TOP 10 APP OPPORTUNITIES ===\n");
console.table(top10);
console.log(`\nFull results saved to scored-apps.json (${scored.length} apps)\n`);
