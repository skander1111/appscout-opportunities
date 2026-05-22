const API = 'https://api.github.com/search/repositories';
const USER_API = 'https://api.github.com/users';
const HEADERS = { 'User-Agent': 'AppScout/1.0', 'Accept': 'application/vnd.github.v3+json' };

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const MOBILE_TOPICS = ['android', 'flutter', 'react-native', 'kotlin', 'java-android', 'ios', 'mobile-app'];
const ABANDONED_README_SIGNALS = /no longer maintained|abandoned|archived|not maintained|looking for maintainer|project is dead|unmaintained|deprecated|looking for new owner|seeking new owner|open to acquisition/i;
const ACTIVE_SIGNALS = /actively maintained|looking for contributors|contributions welcome/i;

function scoreRepo(repo, daysSinceCommit) {
  let score = 0;

  // Stars: proven demand signal
  if (repo.stars >= 1000) score += 35;
  else if (repo.stars >= 500) score += 28;
  else if (repo.stars >= 200) score += 22;
  else if (repo.stars >= 100) score += 16;
  else if (repo.stars >= 50) score += 10;
  else return 0; // not enough proof of demand

  // Abandonment age
  if (daysSinceCommit >= 365 * 3) score += 35;
  else if (daysSinceCommit >= 365 * 2) score += 28;
  else if (daysSinceCommit >= 365) score += 20;
  else if (daysSinceCommit >= 180) score += 8;
  else return 0; // too recent

  // Forks: people cared enough to fork
  if (repo.forks >= 100) score += 10;
  else if (repo.forks >= 30) score += 6;
  else if (repo.forks >= 10) score += 3;

  // Open issues: users still want it
  if (repo.openIssues >= 20) score += 8;
  else if (repo.openIssues >= 5) score += 4;

  // License: can we use/buy it?
  const freeLicenses = ['MIT', 'Apache-2.0', 'GPL-2.0', 'GPL-3.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'];
  if (freeLicenses.includes(repo.license)) score += 5;
  else if (repo.license === 'None') score -= 5; // unclear ownership

  // README abandonment signal — bonus
  if (repo.readmeSignal === 'abandoned') score += 10;
  else if (repo.readmeSignal === 'active') score -= 10;

  // Contact available
  if (repo.ownerEmail) score += 8;

  return Math.min(100, score);
}

async function fetchOwnerEmail(username) {
  try {
    const res = await fetch(`${USER_API}/${username}`, { headers: HEADERS });
    if (!res.ok) return null;
    const user = await res.json();
    return user.email || null;
  } catch {
    return null;
  }
}

async function searchRepos(query, cutoffDays = 365) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - cutoffDays);
  const date = cutoff.toISOString().split('T')[0];

  const url = `${API}?q=${encodeURIComponent(query)}+pushed:<${date}&sort=stars&order=desc&per_page=8`;

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 403) return { repos: [], rateLimited: true };
    if (res.status === 422) return { repos: [], error: 'invalid_query' };
    if (!res.ok) return { repos: [], error: res.status };

    const data = await res.json();
    const items = data.items || [];

    const repos = items.map(r => {
      const daysSince = Math.floor((Date.now() - new Date(r.pushed_at)) / 86_400_000);
      const desc = (r.description || '').toLowerCase();
      const topics = r.topics || [];
      const isMobile = topics.some(t => MOBILE_TOPICS.includes(t)) ||
        /android|flutter|react.native|kotlin|swift|ios/i.test(desc + ' ' + r.name);

      return {
        name: r.full_name,
        title: r.name,
        owner: r.owner?.login,
        description: (r.description || '').substring(0, 120),
        stars: r.stargazers_count,
        forks: r.forks_count,
        openIssues: r.open_issues_count,
        license: r.license?.spdx_id || 'None',
        language: r.language,
        topics,
        lastPush: r.pushed_at?.split('T')[0],
        daysSincePush: daysSince,
        url: r.html_url,
        isMobile,
        archived: r.archived,
        readmeSignal: null,
        ownerEmail: null,
      };
    });

    return { repos, totalFound: data.total_count || 0 };
  } catch (err) {
    return { repos: [], error: err.message };
  }
}

export async function findAbandonedRepos(term) {
  const queries = [
    `android ${term} app`,
    `flutter ${term}`,
    `"${term}" android kotlin`,
  ];

  const seen = new Set();
  const allRepos = [];

  for (const q of queries) {
    const { repos, rateLimited } = await searchRepos(q);
    if (rateLimited) break;

    for (const repo of repos) {
      if (seen.has(repo.name) || repo.archived) continue;
      seen.add(repo.name);

      // Only mobile-relevant repos
      if (!repo.isMobile) continue;

      // Score it
      const score = scoreRepo(repo, repo.daysSincePush);
      if (score < 30) continue;

      repo.opportunityScore = score;
      allRepos.push(repo);
    }

    await sleep(1200);
  }

  // Sort by score
  allRepos.sort((a, b) => b.opportunityScore - a.opportunityScore);

  // Enrich top 3 with owner email (costs API calls)
  for (const repo of allRepos.slice(0, 3)) {
    repo.ownerEmail = await fetchOwnerEmail(repo.owner);
    await sleep(500);
  }

  return {
    repos: allRepos.slice(0, 5),
    totalFound: allRepos.length,
  };
}

export async function findAbandonedByCategory(category) {
  const categoryQueries = {
    fitness:    ['workout tracker android', 'fitness app flutter', 'gym tracker kotlin'],
    meditation: ['meditation app android', 'mindfulness flutter', 'breathing app android'],
    finance:    ['budget tracker android', 'expense tracker flutter', 'finance app kotlin'],
    productivity:['habit tracker android', 'todo app flutter', 'productivity android kotlin'],
    tools:      ['utility app android', 'converter android kotlin', 'calculator flutter'],
    games:      ['casual game android', 'puzzle game flutter', 'trivia android'],
  };

  const queries = categoryQueries[category] || [`${category} android app`];
  const seen = new Set();
  const allRepos = [];

  for (const q of queries) {
    const { repos, rateLimited } = await searchRepos(q, 365);
    if (rateLimited) { await sleep(60000); break; }

    for (const repo of repos) {
      if (seen.has(repo.name) || repo.archived || !repo.isMobile) continue;
      seen.add(repo.name);
      const score = scoreRepo(repo, repo.daysSincePush);
      if (score >= 30) { repo.opportunityScore = score; allRepos.push(repo); }
    }
    await sleep(1500);
  }

  allRepos.sort((a, b) => b.opportunityScore - a.opportunityScore);
  return allRepos.slice(0, 8);
}
