// Owner type classification — tells us who we're actually dealing with

const BIG_COMPANY_DEVELOPERS = [
  // Device manufacturers — their apps are preinstalled, never for sale
  'xiaomi', 'miui', 'samsung', 'huawei', 'oppo', 'vivo', 'oneplus',
  'motorola', 'lenovo', 'asus', 'lg electronics', 'htc', 'nokia', 'sony',
  'realme', 'honor', 'meizu', 'alcatel', 'zte',
  // Major tech
  'google', 'alphabet', 'meta platforms', 'facebook', 'microsoft', 'apple',
  'amazon', 'oracle', 'sap', 'salesforce', 'adobe', 'autodesk',
  // Major consumer apps
  'spotify', 'netflix', 'twitter', 'snapchat', 'bytedance', 'tiktok',
  'airbnb', 'uber', 'lyft', 'booking.com', 'paypal', 'stripe',
  'zoom video', 'slack technologies', 'atlassian', 'dropbox', 'evernote',
  'duolingo', 'babbel', 'busuu', 'memrise', 'epic games', 'activision',
  'electronic arts', 'king.com', 'supercell', 'zynga', 'roblox',
];

const BIG_COMPANY_EMAIL_DOMAINS = [
  '@xiaomi.com', '@samsung.com', '@google.com', '@microsoft.com',
  '@apple.com', '@amazon.com', '@meta.com', '@facebook.com',
  '@bytedance.com', '@tiktok.com', '@adobe.com', '@oracle.com',
  '@spotify.com', '@netflix.com', '@uber.com', '@huawei.com',
];

// AppId prefixes that are always system/manufacturer apps
const SYSTEM_APPID_PREFIXES = [
  'com.google.', 'com.android.', 'android.',
  'com.samsung.', 'com.sec.', 'com.sec.android.',
  'com.xiaomi.', 'com.miui.', 'miui.',
  'com.huawei.', 'com.hihonor.',
  'com.oppo.', 'com.vivo.', 'com.oneplus.',
  'com.asus.', 'com.htc.', 'com.lge.',
  'com.motorola.', 'com.lenovo.',
  'com.microsoft.', 'com.facebook.', 'com.meta.',
];

// Known portfolio aggregators — they buy old apps, slap support@ emails, never develop
const PORTFOLIO_DOMAINS = [
  'dosaapps.com', 'kigelapps.com', 'repairbatterylife.com',
  'useprometheus.app', 'apalon.com', 'bestqualityapps.com',
  'smartmobilesolutions.com', 'digitalwellness.co',
  'iminds.be', 'digitalchemy.co',
];

// Support email pattern used by portfolio aggregators:
// support.APPKEYWORD@GENERICDOMAIN.com
const PORTFOLIO_EMAIL_PATTERN = /^support\.\w{3,}@\w[\w.-]+\.(app|io|net|co|com)$/i;

const PERSONAL_EMAIL_SUFFIXES = [
  '@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com',
  '@icloud.com', '@me.com', '@protonmail.com', '@proton.me',
  '@live.com', '@msn.com', '@aol.com',
];

export function classifyOwner(app) {
  const dev = (app.developer || '').toLowerCase().trim();
  const email = (app.developerEmail || '').toLowerCase().trim();
  const appId = (app.appId || '').toLowerCase();
  const installs = app.minInstalls || 0;

  // Instant disqualifiers — system/manufacturer
  if (installs >= 500_000_000) return 'Big company';
  if (SYSTEM_APPID_PREFIXES.some(p => appId.startsWith(p))) return 'Big company';
  if (BIG_COMPANY_EMAIL_DOMAINS.some(d => email.endsWith(d))) return 'Big company';
  if (BIG_COMPANY_DEVELOPERS.some(name => dev.includes(name))) return 'Big company';

  // Portfolio/acquirer
  if (email && PORTFOLIO_DOMAINS.some(d => email.endsWith(d))) return 'Portfolio/acquirer';
  if (email && PORTFOLIO_EMAIL_PATTERN.test(email)) return 'Portfolio/acquirer';

  // Solo indie — personal email is the strongest indie signal
  if (email && PERSONAL_EMAIL_SUFFIXES.some(d => email.endsWith(d))) return 'Solo indie';

  // Small studio — has own professional domain
  if (email && email.includes('@')) return 'Small studio';

  return 'Unknown';
}

// How much risk each owner type adds to acquisition
export function ownerRiskPenalty(ownerType) {
  return {
    'Big company': 100,         // effectively disqualifies
    'Portfolio/acquirer': 25,   // already flipped, harder deal, higher price
    'Unknown': 15,              // can't reach → risky
    'Small studio': 0,          // clean deal likely
    'Solo indie': 0,            // best opportunity, motivated seller
  }[ownerType] ?? 15;
}
