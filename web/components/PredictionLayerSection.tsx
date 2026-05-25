// Visual section explaining the 8 AI scores + premium gate.

const SCORES = [
  { label: "Opportunity",       value: 91, color: "#00ff88", locked: false },
  { label: "Demand",            value: 88, color: "#00ff88", locked: false },
  { label: "Money potential",   value: 76, color: "#3b82f6", locked: false },
  { label: "Build difficulty",  value: 42, color: "#a855f7", locked: false },
  { label: "Acquisition diff.", value: 38, color: "#a855f7", locked: true  },
  { label: "Legal risk",        value: 22, color: "#facc15", locked: true  },
  { label: "Competition risk",  value: 47, color: "#facc15", locked: true  },
  { label: "Outreach draft",    value: 100, color: "#00ff88", locked: true, isText: true },
];

export default function PredictionLayerSection() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">AI prediction layer</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Every opportunity is scored on 8 axes</h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Powered by Claude. AppScout reads every signal — installs, stars, reviews, niche, risk —
            and tells you whether to acquire, rebuild, or walk away.
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background: "linear-gradient(160deg, #07090b 0%, #060708 100%)",
          }}
        >
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">opportunity</p>
                <h3 className="text-xl font-semibold text-white">Barcode Scanner – Price Finder</h3>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full border border-neon/30 text-neon bg-neon/10 font-semibold uppercase tracking-wider">
                acquire
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-6">Google Play · 5M+ installs · 546 days stale · Solo indie owner</p>

            <div className="space-y-3">
              {SCORES.filter((s) => !s.isText).map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-36 shrink-0">{s.label}</span>
                  <div className="flex-1 h-2 bg-[#0d0d14] rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.value}%`,
                        background: s.color,
                        boxShadow: `0 0 12px ${s.color}55`,
                        filter: s.locked ? "blur(2.5px)" : undefined,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold tabular-nums w-10 text-right ${s.locked ? "blur-[3px] select-none" : ""}`}
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-white/5">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Recommended action</p>
              <p className="text-sm text-zinc-200 leading-relaxed">
                <span className="text-neon font-semibold">Acquire now.</span> The owner is reachable,
                installs prove demand, and the 546-day silence is the cleanest acquisition window we&apos;ve seen this quarter.
                Outreach draft and contact email are unlocked for paying members.
              </p>
            </div>
          </div>

          <div className="border-l border-white/5 lg:pl-8">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-3">Unlock includes</p>
            <ul className="space-y-2 text-sm text-zinc-300 mb-6">
              <li className="flex items-start gap-2"><span className="text-neon">✓</span> All 8 AI scores</li>
              <li className="flex items-start gap-2"><span className="text-neon">✓</span> Ready-to-send outreach</li>
              <li className="flex items-start gap-2"><span className="text-neon">✓</span> Due-diligence checklist</li>
              <li className="flex items-start gap-2"><span className="text-neon">✓</span> Monetization angles</li>
              <li className="flex items-start gap-2"><span className="text-neon">✓</span> Profile match scoring</li>
            </ul>

            <a
              href="#pricing"
              className="block text-center text-sm font-bold text-black px-4 py-3 rounded-lg"
              style={{
                background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
                boxShadow: "0 0 25px rgba(0,255,136,0.35)",
              }}
            >
              Unlock from $9
            </a>
            <p className="text-[10px] text-zinc-600 text-center mt-2 uppercase tracking-widest">
              monthly &amp; yearly only for full AI
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
