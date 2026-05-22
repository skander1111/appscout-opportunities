const sampleApp = {
  name: "Tabata Timer: Interval Timer",
  niche: "Timer / Fitness",
  installs: "5,000,000+",
  rating: "4.90",
  daysSinceUpdate: 420,
  ownerType: "Solo indie",
  opportunityScore: 90,
  classification: "Potential acquisition target",
  whyInteresting: [
    "Over a year without an update — developer likely moved on",
    "5M+ installs proves strong organic demand",
    "Solo indie developer — single point of contact, motivated seller",
  ],
  riskLabel: "Low",
};

function BlurredField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div
        className="text-sm font-medium text-zinc-200 select-none"
        style={{ filter: "blur(5px)" }}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray={`${score} 100`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-400">
          {score}
        </span>
      </div>
      <div className="text-xs text-zinc-400">opportunity<br />score</div>
    </div>
  );
}

export default function SampleOpportunity() {
  return (
    <section id="sample" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What's inside a report
          </h2>
          <p className="text-zinc-400 text-lg">
            Every opportunity comes with full analysis — not just a list of app names.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          {/* Card header */}
          <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-sm font-medium text-zinc-300">
                {sampleApp.classification} — {sampleApp.niche}
              </span>
            </div>
            <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded">Sample</span>
          </div>

          <div className="p-6">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{sampleApp.name}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                  <span>{sampleApp.installs} installs</span>
                  <span>·</span>
                  <span>★ {sampleApp.rating}</span>
                  <span>·</span>
                  <span>{sampleApp.daysSinceUpdate} days since update</span>
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
                    <span className="text-emerald-400 mt-0.5">→</span>
                    {reason}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid of fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Owner type</div>
                <div className="text-sm font-medium text-emerald-400">{sampleApp.ownerType}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Risk level</div>
                <div className="text-sm font-medium text-white">{sampleApp.riskLabel}</div>
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
                  <span className="bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded">outdated UI</span>
                  <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-1 rounded">missing features</span>
                </div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-4">
                  Outreach email draft
                </div>
                <div className="text-sm text-zinc-400 leading-relaxed">
                  Hi, I came across your app on Google Play and wanted to reach out…
                  I'm interested in a quick conversation about the app's future…
                </div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-4">
                  Due diligence checklist
                </div>
                <div className="text-sm text-zinc-400">
                  ☐ Monthly active users &nbsp;☐ Revenue (ads + IAP) &nbsp;☐ Source code ownership…
                </div>
              </div>

              {/* Unlock overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-[#0a0a0f]/60 to-[#0a0a0f]/90">
                <div className="text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <p className="text-sm text-zinc-400 mb-4">
                    Full report unlocked after purchase
                  </p>
                  <a
                    href="#pricing"
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Unlock for €19
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-4">
          Real data from our engine. Each report includes 10+ opportunities like this — human-reviewed before delivery.
        </p>
      </div>
    </section>
  );
}
