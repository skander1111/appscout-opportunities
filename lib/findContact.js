/**
 * findContact.js — Universal developer contact finder
 *
 * Given a developer name and optional website URL, tries every available
 * signal to find a real email or social link:
 *
 *   1. Fetch developer website → scrape emails from page + common sub-paths
 *   2. Check App Store support/privacy-policy URL for email
 *   3. Search GitHub by developer name → check public profile email
 *   4. Try common email patterns against the domain (contact@, hello@, dev@…)
 *   5. Check the app's own App Store / Play Store page for contact links
 */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Email regex — matches most real email formats
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,7}/g;

// Domains to ignore — system/tracking emails, not real contacts
const NOISE_DOMAINS = new Set([
  'sentry.io', 'example.com', 'test.com', 'wixpress.com',
  'apple.com', 'googleplay.com', 'google.com', 'android.com',
  'itunes.com', 'icloud.com', 'me.com', 'mac.com',
  'amazonaws.com', 'cloudfront.net', 'sendgrid.net', 'mailchimp.com',
  'squarespace.com', 'shopify.com', 'wordpress.com', 'wix.com',
]);

// Common contact paths to check on a developer website
const CONTACT_PATHS = [
  '',
  '/contact',
  '/contact-us',
  '/about',
  '/about-us',
  '/support',
  '/privacy',
  '/privacy-policy',
  '/help',
];

// Common email prefixes to try when we have a domain
const COMMON_PREFIXES = ['contact', 'hello', 'hi', 'info', 'support', 'dev', 'developer', 'app'];

const GITHUB_API = 'https://api.github.com';
const GITHUB_HEADERS = { 'User-Agent': 'AppScout/1.0', Accept: 'application/vnd.github.v3+json' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  const domain = email.split('@')[1] ?? '';
  if (NOISE_DOMAINS.has(domain)) return false;
  if (domain.includes('example')) return false;
  if (email.length > 80) return false;
  // Must have at least one dot in domain
  return domain.includes('.');
}

function extractEmailsFromHtml(html) {
  // Decode HTML entities first
  const decoded = html
    .replace(/&#64;/g, '@')
    .replace(/&#x40;/g, '@')
    .replace(/\[at\]/gi, '@')
    .replace(/\(at\)/gi, '@')
    .replace(/\s+at\s+/gi, '@')
    .replace(/&#46;/g, '.')
    .replace(/\[dot\]/gi, '.')
    .replace(/\(dot\)/gi, '.');

  const emails = decoded.match(EMAIL_RE) ?? [];
  return [...new Set(emails)].filter(isValidEmail);
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function normalizeUrl(url) {
  if (!url) return null;
  if (!url.startsWith('http')) url = 'https://' + url;
  return url.replace(/\/$/, '');
}

async function fetchSafe(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 AppScout/1.0' },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('html') && !ct.includes('text')) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ── Step 1: Scrape developer website ──────────────────────────────────────────

async function findEmailsOnWebsite(websiteUrl) {
  const base = normalizeUrl(websiteUrl);
  if (!base) return [];

  const found = new Set();

  for (const path of CONTACT_PATHS) {
    const url = base + path;
    const html = await fetchSafe(url);
    if (!html) continue;

    const emails = extractEmailsFromHtml(html);
    emails.forEach(e => found.add(e));

    // Stop once we found something — don't hammer the site
    if (found.size >= 2) break;

    await sleep(300);
  }

  return [...found];
}

// ── Step 2: Search GitHub by developer name ───────────────────────────────────

async function findOnGitHub(developerName) {
  try {
    const query = encodeURIComponent(developerName.replace(/[^\w\s]/g, ' ').trim());
    const searchRes = await fetch(
      `${GITHUB_API}/search/users?q=${query}+type:user&per_page=3`,
      { headers: GITHUB_HEADERS },
    );
    if (!searchRes.ok) return null;

    const { items = [] } = await searchRes.json();
    if (!items.length) return null;

    for (const user of items) {
      await sleep(500);
      const profileRes = await fetch(`${GITHUB_API}/users/${user.login}`, { headers: GITHUB_HEADERS });
      if (!profileRes.ok) continue;

      const profile = await profileRes.json();
      if (profile.email && isValidEmail(profile.email)) {
        return {
          email: profile.email,
          github: profile.html_url,
          name: profile.name ?? user.login,
          bio: profile.bio ?? null,
          blog: profile.blog ?? null,
        };
      }
    }
  } catch {
    // GitHub rate limit or network error — ignore
  }
  return null;
}

// ── Step 3: Try common email prefixes against a domain ────────────────────────

function guessEmails(domain) {
  if (!domain) return [];
  return COMMON_PREFIXES.map(prefix => `${prefix}@${domain}`);
}

// ── Step 4: App Store — fetch app page for extra links ────────────────────────

async function findInAppStorePage(appStoreUrl) {
  if (!appStoreUrl) return [];
  const html = await fetchSafe(appStoreUrl);
  if (!html) return [];
  return extractEmailsFromHtml(html);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Find all available contact info for a developer.
 *
 * @param {object} opts
 * @param {string} opts.developerName   - Display name of the developer
 * @param {string} [opts.websiteUrl]    - Developer website (from App Store sellerUrl or Play Store)
 * @param {string} [opts.supportUrl]    - App support URL
 * @param {string} [opts.appStoreUrl]   - iOS App Store product page URL
 * @param {string} [opts.existingEmail] - Already-known email (skip search if set)
 *
 * @returns {Promise<{
 *   email: string|null,
 *   emailSource: string|null,
 *   github: string|null,
 *   githubEmail: string|null,
 *   website: string|null,
 *   guessedEmails: string[],
 *   reachability: 'high'|'medium'|'low',
 * }>}
 */
export async function findContact({
  developerName,
  websiteUrl,
  supportUrl,
  appStoreUrl,
  existingEmail,
} = {}) {
  // If we already have an email from the store listing, just enrich
  if (existingEmail && isValidEmail(existingEmail)) {
    const domain = existingEmail.split('@')[1];
    return {
      email: existingEmail,
      emailSource: 'store-listing',
      github: null,
      githubEmail: null,
      website: websiteUrl ?? null,
      guessedEmails: [],
      reachability: 'high',
    };
  }

  const results = {
    email: null,
    emailSource: null,
    github: null,
    githubEmail: null,
    website: normalizeUrl(websiteUrl) ?? normalizeUrl(supportUrl) ?? null,
    guessedEmails: [],
    reachability: 'low',
  };

  // 1. Scrape developer website
  const primaryUrl = websiteUrl || supportUrl;
  if (primaryUrl) {
    const websiteEmails = await findEmailsOnWebsite(primaryUrl);
    if (websiteEmails.length) {
      results.email = websiteEmails[0];
      results.emailSource = 'developer-website';
      results.reachability = 'high';
    }
  }

  // 2. Check App Store page for contact links
  if (!results.email && appStoreUrl) {
    const storeEmails = await findInAppStorePage(appStoreUrl);
    if (storeEmails.length) {
      results.email = storeEmails[0];
      results.emailSource = 'app-store-page';
      results.reachability = 'high';
    }
  }

  // 3. Search GitHub
  if (developerName) {
    await sleep(500);
    const gh = await findOnGitHub(developerName);
    if (gh) {
      results.github = gh.github;
      if (gh.email) {
        results.githubEmail = gh.email;
        if (!results.email) {
          results.email = gh.email;
          results.emailSource = 'github-profile';
          results.reachability = 'high';
        }
      } else {
        // Found GitHub but no email — medium reachability via DM
        if (!results.email) results.reachability = 'medium';
      }
    }
  }

  // 4. Generate educated email guesses from domain
  const domain = extractDomain(websiteUrl ?? supportUrl ?? '');
  if (domain) {
    results.guessedEmails = guessEmails(domain);
    if (!results.email && results.reachability === 'low') {
      results.reachability = 'medium'; // at least we have guesses to try
    }
  }

  return results;
}
