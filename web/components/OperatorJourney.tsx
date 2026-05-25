const STEPS = [
  {
    n: "01",
    color: "#00ff88",
    title: "Scan",
    sub: "the entire market",
    body: "AppScout runs 8 ingestion pipelines around the clock — Google Play, App Store, GitHub, Reddit, Hacker News, Product Hunt, Indie Hackers, plus your marketplace submissions. Every signal is normalized into the same opportunity schema.",
  },
  {
    n: "02",
    color: "#3b82f6",
    title: "Score",
    sub: "with our AI",
    body: "Each opportunity passes through our 8-axis analyzer: opportunity, demand, money potential, build difficulty, acquisition difficulty, legal risk, competition, and recommended action. Plus a draft outreach script and due-diligence checklist.",
  },
  {
    n: "03",
    color: "#fbbf24",
    title: "Strike",
    sub: "before anyone notices",
    body: "Copy the outreach. Send it. Run the ROI simulator. Add to watchlist. Pin operator notes. AppScout's whole flow is built around acting in hours, not weeks — because the moment something hits Flippa, your margin gets cut in half.",
  },
];

export default function OperatorJourney() {
  return (
    <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 80% 50%, rgba(0,255,136,0.04), transparent 70%)" }}
      />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">The workflow</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Three steps. <span className="shimmer-text">Hours, not weeks.</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            From signal to outreach in less time than it takes most operators to open a spreadsheet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div
            className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px -z-10"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.3) 20%, rgba(59,130,246,0.3) 50%, rgba(251,191,36,0.3) 80%, transparent)" }}
          />

          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div
                className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-5 font-mono font-bold text-3xl"
                style={{
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}40`,
                  color: s.color,
                  boxShadow: `0 0 40px ${s.color}25`,
                }}
              >
                {s.n}
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{s.title}</h3>
              <p className="text-sm font-mono uppercase tracking-widest mb-4" style={{ color: s.color }}>{s.sub}</p>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
