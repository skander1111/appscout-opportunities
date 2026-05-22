import gplay from 'google-play-scraper';

console.log('Starting search...');

gplay.search({
  term: 'language learning',
  num: 50,
  lang: 'en',
  country: 'us'
}).then(apps => {
  console.log(`Got ${apps.length} apps`);
  apps.forEach(app => {
    console.log(JSON.stringify({
      title: app.title,
      appId: app.appId,
      score: app.score,
      installs: app.installs,
      developer: app.developer,
      updated: app.updated
    }));
  });
}).catch(err => {
  console.error('Error:', err.message);
  console.error(err.stack);
});
