import gplay from "google-play-scraper";
import fs from "fs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("Searching apps...");

  const apps = await gplay.search({
    term: "language learning",
    num: 20,
    lang: "en",
    country: "us",
  });

  console.log(`Found ${apps.length} apps`);

  const results = [];

  for (const app of apps) {
    try {
      console.log("Getting details for:", app.title);

      const details = await gplay.app({
        appId: app.appId,
        lang: "en",
        country: "us",
      });

      results.push({
        title: details.title,
        appId: details.appId,
        url: details.url,
        developer: details.developer,
        developerEmail: details.developerEmail || null,
        installs: details.installs || null,
        minInstalls: details.minInstalls || null,
        score: details.score || null,
        ratings: details.ratings || null,
        reviews: details.reviews || null,
        updated: details.updated || null,
        updatedDate: details.updated
          ? new Date(details.updated).toISOString().split("T")[0]
          : null,
        released: details.released || null,
        free: details.free,
        offersIAP: details.offersIAP,
        adSupported: details.adSupported,
        recentChanges: details.recentChanges || null,
      });

      await sleep(1500);
    } catch (error) {
      console.log("Error:", app.title, error.message);
    }
  }

  fs.writeFileSync("apps-detailed.json", JSON.stringify(results, null, 2));

  console.log("Done. Saved to apps-detailed.json");
}

main();
