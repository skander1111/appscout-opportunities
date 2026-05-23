const sampleApp = {
  name: "Tabata Timer: Interval Timer",
  niche: "Timer / Fitness",
  installs: "5,000,000+",
  rating: "4.90",
  daysSinceUpdate: 421,
  ownerType: "Solo indie",
  opportunityScore: 90,
  play: "Acquire",
  whyInteresting: [
    "421 days without an update — developer has clearly moved on",
    "5M+ installs proves massive organic demand in a proven niche",
    "Solo indie developer — one email, motivated seller, no board approval needed",
  ],
  riskLabel: "Low",
};

function BlurredField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-zinc-200 select-none" style={{ filter: "blur(5px)" }}>
        {value}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const dash = (score / 100) * 87.96;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#1a2a1e" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke="#00ff88"
            strokeWidth="3"
            strokeDasharray={`${dash} 87.96`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-bold"
          style={{ color: "#00ff88", textShadow: "0 0 12px rgba(0,255,136,0.5)" }}
        >
          {score}
        </span>
      </div>
      <div className="text-[10px] text-zinc-600 text-center">score</div>
    </div>
  );
}

export default function SampleOpportunity() {
  return (
    <section id="sample" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Sample report card</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">What&apos;s inside a report</h2>
          <p className="text-zinc-400 text-lg">
            Every opportunity comes with full analysis — not just a list of app names.
          </p>
        </div>

        <div
          className="bg-white/[0.02] rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(0,255,136,0.12)" }}
        >
          {/* Card header */}
          <div
            className="border-b border-white/5 px-6 py-4 flex items-center justify-between"
            style={{ background: "rgba(0,255,136,0.03)" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-2 w-2">
                <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
              </div>
              <span className="text-sm font-semibold text-neon">
                {sampleApp.play}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-sm text-zinc-400">{sampleApp.niche}</span>
            </div>
            <span className="text-xs text-zinc-600 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
              Sample
            </span>
          </div>

          <div className="p-6">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{sampleApp.name}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                  <span>{sampleApp.installs} installs</span>
                  <span className="text-zinc-700">·</span>
                  <span>★ {sampleApp.rating}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-red-400">{sampleApp.daysSinceUpdate} days stale</span>
                </div>
              </div>
              <ScoreBadge score={sampleApp.opportunityScore} />
            </div>

            {/* Why interesting */}
            <div className="mb-6">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
                Why this is interesting
              </div>
              <div className="space-y-2">
                {sampleApp.whyInteresting.map((reason) => (
                  <div key={reason} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-neon mt-0.5 flex-shrink-0">→</span>
                    {reason}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid of fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Owner type</div>
                <div className="text-sm font-semibold text-neon">{sampleApp.ownerType}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Risk level</div>
                <div className="text-sm font-semibold text-white">{sampleApp.riskLabel}</div>
              </div>
              <BlurredField label="Developer email" value="dev@example.com" />
              <BlurredField label="Developer name" value="John Developer" />
            </div>

            {/* Locked sections */}
            <div className="relative rounded-xl overflow-hidden border border-white/5">
              <div className="p-4 space-y-3 blur-sm pointer-events-none select-none">
                <div className="text-xs text-zinc-500 uppercase tracking-widest">
                  User complaints (from 60 recent reviews)
                </div>
                <div className="flex gap-2">
                  <span className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded">crashes</span>
                  <span className="bg-zinc-500/10 text-zinc-400 text-xs px-2 py-1 rounded">outdated UI</span>
                  <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-1 rounded">missing features</span>
                </div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-4">
                  Outreach email draft
                </div>
                <div className="text-sm text-zinc-400 leading-relaxed">
                  Hi, I came across your app on Google Play and wanted to reach out…
                  I&apos;m interested in a quick conversation about the app&apos;s future…
                </div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-4">
                  Due diligence checklist
                </div>
                <div className="text-sm text-zinc-400">
                  ☐ Monthly active users &nbsp;☐ Revenue (ads + IAP) &nbsp;☐ Source code ownership…
                </div>
              </div>

              {/* Unlock overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-[#050508]/70 to-[#050508]/95">
                <div className="text-center">
                  <div className="text-3xl mb-3">🔒</div>
                  <p className="text-sm text-zinc-400 mb-5">
                    Full report unlocked after purchase
                  </p>
                  <a
                    href="#pricing"
                    className="inline-block text-black font-bold text-sm px-6 py-3 rounded-xl transition-all"
                    style={{
                      background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
                      boxShadow: "0 0 25px rgba(0,255,136,0.4)",
                    }}
                  >
                    Unlock for €19
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-600 mt-5">
          Real data from our engine · Each report includes 10+ opportunities like this · Human-reviewed before delivery
        </p>
      </div>
    </section>
  );
}
