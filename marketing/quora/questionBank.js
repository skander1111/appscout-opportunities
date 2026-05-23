/**
 * questionBank.js
 * 30+ real Quora question patterns relevant to AppScout.
 * Rotated daily by dailyRun.js — each question is answered once and retired.
 */

const QUESTION_BANK = [
  // ── App Acquisition ──────────────────────────────────────────────
  {
    question: 'How do I find mobile apps to acquire without using Flippa?',
    url: 'https://www.quora.com/search?q=find+mobile+apps+acquire+without+flippa',
    category: 'App Acquisition',
  },
  {
    question: 'What is the best way to buy an existing mobile app from an indie developer?',
    url: 'https://www.quora.com/search?q=buy+existing+mobile+app+indie+developer',
    category: 'App Acquisition',
  },
  {
    question: 'How do you approach a developer about buying their mobile app?',
    url: 'https://www.quora.com/search?q=approach+developer+buying+mobile+app',
    category: 'App Acquisition',
  },
  {
    question: 'Is it better to buy an existing app or build one from scratch?',
    url: 'https://www.quora.com/search?q=better+buy+existing+app+or+build+from+scratch',
    category: 'App Acquisition',
  },
  {
    question: 'How do you value a mobile app for acquisition?',
    url: 'https://www.quora.com/search?q=how+value+mobile+app+acquisition',
    category: 'App Acquisition',
  },
  {
    question: 'What due diligence should I do before buying a mobile app?',
    url: 'https://www.quora.com/search?q=due+diligence+before+buying+mobile+app',
    category: 'App Acquisition',
  },
  {
    question: 'How do I negotiate the price when acquiring a mobile app?',
    url: 'https://www.quora.com/search?q=negotiate+price+acquiring+mobile+app',
    category: 'App Acquisition',
  },

  // ── Abandoned Apps ───────────────────────────────────────────────
  {
    question: 'Are there good opportunities in buying abandoned mobile apps?',
    url: 'https://www.quora.com/search?q=opportunities+buying+abandoned+mobile+apps',
    category: 'Abandoned Apps',
  },
  {
    question: 'What happens to mobile apps that are no longer maintained?',
    url: 'https://www.quora.com/search?q=what+happens+mobile+apps+no+longer+maintained',
    category: 'Abandoned Apps',
  },
  {
    question: 'Why do developers abandon apps that still have millions of downloads?',
    url: 'https://www.quora.com/search?q=why+developers+abandon+apps+millions+downloads',
    category: 'Abandoned Apps',
  },
  {
    question: 'Can you make money buying and reviving old apps on Google Play?',
    url: 'https://www.quora.com/search?q=make+money+buying+reviving+old+apps+google+play',
    category: 'Abandoned Apps',
  },
  {
    question: 'How do you find apps on the App Store that have been abandoned by their developers?',
    url: 'https://www.quora.com/search?q=find+apps+abandoned+developers+app+store',
    category: 'Abandoned Apps',
  },
  {
    question: 'Is it worth buying an app that hasn\'t been updated in 2 years?',
    url: 'https://www.quora.com/search?q=worth+buying+app+not+updated+2+years',
    category: 'Abandoned Apps',
  },

  // ── Micro-Acquisitions ───────────────────────────────────────────
  {
    question: 'What are the best micro-acquisition opportunities in mobile apps right now?',
    url: 'https://www.quora.com/search?q=best+micro+acquisition+opportunities+mobile+apps',
    category: 'Micro-Acquisitions',
  },
  {
    question: 'How do I get started with micro-acquisitions as a first-time buyer?',
    url: 'https://www.quora.com/search?q=get+started+micro+acquisitions+first+time+buyer',
    category: 'Micro-Acquisitions',
  },
  {
    question: 'What is a realistic budget for buying a small mobile app business?',
    url: 'https://www.quora.com/search?q=realistic+budget+buying+small+mobile+app+business',
    category: 'Micro-Acquisitions',
  },
  {
    question: 'Has anyone successfully bought a small app and grown it significantly?',
    url: 'https://www.quora.com/search?q=successfully+bought+small+app+grew+significantly',
    category: 'Micro-Acquisitions',
  },

  // ── Flippa Alternatives ──────────────────────────────────────────
  {
    question: 'What are good alternatives to Flippa for buying mobile apps?',
    url: 'https://www.quora.com/search?q=alternatives+flippa+buying+mobile+apps',
    category: 'Flippa Alternatives',
  },
  {
    question: 'Is Flippa worth it for buying apps or are there better options?',
    url: 'https://www.quora.com/search?q=flippa+worth+it+buying+apps+better+options',
    category: 'Flippa Alternatives',
  },
  {
    question: 'Where can I find app acquisition deals before they get listed on marketplaces?',
    url: 'https://www.quora.com/search?q=app+acquisition+deals+before+listed+marketplaces',
    category: 'Flippa Alternatives',
  },
  {
    question: 'What are the disadvantages of buying apps through Flippa?',
    url: 'https://www.quora.com/search?q=disadvantages+buying+apps+through+flippa',
    category: 'Flippa Alternatives',
  },

  // ── Rebuild Opportunities ────────────────────────────────────────
  {
    question: 'How do you identify mobile apps worth rebuilding from scratch?',
    url: 'https://www.quora.com/search?q=identify+mobile+apps+worth+rebuilding',
    category: 'Rebuild Opportunities',
  },
  {
    question: 'Is it a good strategy to clone an abandoned app that still gets downloads?',
    url: 'https://www.quora.com/search?q=clone+abandoned+app+still+gets+downloads+strategy',
    category: 'Rebuild Opportunities',
  },
  {
    question: 'What niches have the most untapped opportunity in mobile apps right now?',
    url: 'https://www.quora.com/search?q=niches+untapped+opportunity+mobile+apps',
    category: 'Rebuild Opportunities',
  },

  // ── Indie Developer / Partnership ────────────────────────────────
  {
    question: 'How do you partner with an indie developer who has a struggling app?',
    url: 'https://www.quora.com/search?q=partner+indie+developer+struggling+app',
    category: 'Partnership',
  },
  {
    question: 'As a developer, should I sell my app or find a business partner?',
    url: 'https://www.quora.com/search?q=developer+sell+app+or+find+business+partner',
    category: 'Partnership',
  },
  {
    question: 'What is a fair revenue share deal when partnering with an app developer?',
    url: 'https://www.quora.com/search?q=fair+revenue+share+deal+partnering+app+developer',
    category: 'Partnership',
  },

  // ── Strategy / Mindset ───────────────────────────────────────────
  {
    question: 'What is the best way to find undervalued digital assets to acquire?',
    url: 'https://www.quora.com/search?q=find+undervalued+digital+assets+acquire',
    category: 'Strategy',
  },
  {
    question: 'How do successful app entrepreneurs find deals before they go to market?',
    url: 'https://www.quora.com/search?q=successful+app+entrepreneurs+find+deals+before+market',
    category: 'Strategy',
  },
  {
    question: 'Is buying an app with existing users better than starting from zero?',
    url: 'https://www.quora.com/search?q=buying+app+existing+users+better+starting+zero',
    category: 'Strategy',
  },
  {
    question: 'What signals indicate that a mobile app developer is open to selling?',
    url: 'https://www.quora.com/search?q=signals+mobile+app+developer+open+to+selling',
    category: 'Strategy',
  },
];

module.exports = { QUESTION_BANK };
