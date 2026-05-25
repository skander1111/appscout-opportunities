const SOURCES = [
  { name: "Google Play",    desc: "App store metadata + reviews + dev contacts", color: "#00ff88", live: true },
  { name: "App Store",      desc: "iOS app discovery + ratings + freshness",      color: "#00ff88", live: true },
  { name: "GitHub",         desc: "Trending + stale repos with real user pull",   color: "#3b82f6", live: true },
  { name: "Hacker News",    desc: "Show HN, Ask HN, acquisition discussions",     color: "#fb923c", live: true },
  { name: "Product Hunt",   desc: "Launches losing maintainer momentum",          color: "#a855f7", live: true },
  { name: "Reddit",         desc: "Public seller posts and partner requests",     color: "#facc15", live: false },
  { name: "Indie Hackers",  desc: "Bootstrapped projects + revenue signals",      color: "#22d3ee", live: true },
  { name: "Tech Magazines", desc: "TechCrunch, The Verge, Wired — deal & exit signals", color: "#f97316", live: true },
  { name: "Threads",        desc: "Indie-dev chatter + acquisition posts",        color: "#ec4899", live: true },
  { name: "User submissions", desc: "Projects you submit through AppScout",       color: "#a3e635", live: true },
];

export default function SourcesSection() {
  return (
    <section id="sources" className="py-20 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Sources</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ten streams. One terminal.</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Every signal answers one question:{" "}
            <span className="text-neon font-semibold">can someone buy, rebuild, partner, sell, or make money from this?</span>{" "}
            We don&apos;t cover news. We cover deals.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SOURCES.map((s) => (
            <div
              key={s.name}
              className="bg-[#0a0a10] border border-[#1a1a26] rounded-xl p-4 hover:border-[#2a2a3e] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                <span className={`text-[9px] uppercase tracking-widest font-mono ${s.live ? "text-zinc-500" : "text-zinc-700"}`}>
                  {s.live ? "live" : "pending"}
                </span>
              </div>
              <div className="text-sm font-semibold text-white mb-1">{s.name}</div>
              <p className="text-[11px] text-zinc-500 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-zinc-600">
          Reddit ingestion paused until commercial API approval. All sources operate within official rate limits + terms of service.
        </p>
      </div>
    </section>
  );
}
