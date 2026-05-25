const TOOLS = [
  {
    href: "/pulse",
    icon: "⚡",
    title: "Daily Pulse",
    blurb: "60-second briefing on what changed across all sources today.",
    color: "#00ff88",
  },
  {
    href: "/search",
    icon: "🔍",
    title: "AI search",
    blurb: "Describe what you want in plain English. Claude ranks every opportunity.",
    color: "#3b82f6",
  },
  {
    href: "/lookup",
    icon: "🎯",
    title: "Reverse lookup",
    blurb: "Paste any Play Store, App Store, GitHub, or Reddit URL → instant intel.",
    color: "#a855f7",
  },
  {
    href: "/today",
    icon: "📰",
    title: "App of the day",
    blurb: "AI-written investigation: owner, revenue, rebuild plan, outreach script.",
    color: "#facc15",
  },
  {
    href: "/niches",
    icon: "🗺",
    title: "Niche heat map",
    blurb: "Which categories are running hot. Click any cell to filter the terminal.",
    color: "#fb923c",
  },
  {
    href: "/reviews-stream",
    icon: "💢",
    title: "Reviews stream",
    blurb: "Live 1- and 2-star reviews from stale apps. Rebuild opportunities surface here.",
    color: "#ef4444",
  },
  {
    href: "/watchlist",
    icon: "★",
    title: "Watchlist",
    blurb: "Pin any opportunity. Track changes on the items you care about.",
    color: "#facc15",
  },
  {
    href: "/match",
    icon: "🤝",
    title: "Profile match",
    blurb: "Tell us your goal + budget + skills. Claude picks the opportunities that fit you.",
    color: "#22d3ee",
  },
];

export default function ToolsGrid() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Intelligence tools</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Eight ways to find your next deal</h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Every tool runs on the same engine + AI layer. Use one, use all of them — they all surface the same signal from different angles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TOOLS.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className="block bg-[#0a0a10] border border-[#1a1a26] rounded-xl p-5 hover:border-[#2a2a3e] transition-all group"
            >
              <div className="text-2xl mb-3" style={{ filter: `drop-shadow(0 0 8px ${t.color}55)` }}>{t.icon}</div>
              <div className="text-sm font-semibold text-white mb-1.5 group-hover:text-neon transition-colors">{t.title}</div>
              <p className="text-[12px] text-zinc-500 leading-relaxed">{t.blurb}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
