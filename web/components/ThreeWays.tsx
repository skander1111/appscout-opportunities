const ways = [
  {
    tag: "Acquire",
    tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    icon: "🎯",
    headline: "Buy an app that already has users.",
    body: "Find indie-owned apps with 500k–10M installs, last updated 1–3 years ago. Reach the developer before they list on Flippa or Acquire.com. Buy a proven product at pre-market prices — no auction, no broker fee, no bidding war.",
    signals: ["500k–10M installs", "365+ days abandoned", "Solo indie owner", "Developer email found"],
    example: "An app with 5M downloads and a 4.9 rating. Last update: 546 days ago. Developer email: public. Nobody else has reached out yet.",
    exampleColor: "border-emerald-500/20 bg-emerald-500/5",
  },
  {
    tag: "Rebuild",
    tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    icon: "🔨",
    headline: "Build a better version of something people already want.",
    body: "Users are already complaining. Reviews are screaming for fixes. The demand is proven — you don't need to validate it. Ship a better product in the same niche, capture the existing audience, and outrank an app that hasn't been updated in a year.",
    signals: ["Active user base", "Repeated complaints", "Outdated UI or ads", "No competitor update"],
    example: "A habit tracker with 1M installs and 300 reviews saying 'crashes constantly'. The dev went quiet. The niche is real — the execution just broke.",
    exampleColor: "border-blue-500/20 bg-blue-500/5",
  },
  {
    tag: "Partner",
    tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    icon: "🤝",
    headline: "Team up before they burn out.",
    body: "The developer built the audience. You bring the capital, marketing muscle, or technical help. Structure a revenue share, co-founder deal, or acqui-hire. Get in before the app dies quietly and someone else picks up the domain for $10.",
    signals: ["App still live", "Developer overwhelmed", "Seller post on Reddit", "Asking advice, not price"],
    example: "A Reddit post: 'Built an app with 4,000 users, don't have time to grow it anymore.' Nobody replied. That's a partnership waiting to happen.",
    exampleColor: "border-purple-500/20 bg-purple-500/5",
  },
];

export default function ThreeWays() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Three ways to move
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Every opportunity fits one of three plays
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            AppScout classifies every find automatically so you know exactly what to do next — not just that something exists.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {ways.map((w) => (
            <div
              key={w.tag}
              className="card-hover relative rounded-2xl p-6 bg-white/[0.02] border border-white/8 flex flex-col gap-5"
            >
              {/* Tag + icon */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{w.icon}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${w.tagColor}`}>
                  {w.tag}
                </span>
              </div>

              {/* Headline */}
              <div>
                <h3 className="text-lg font-bold text-white leading-snug mb-3">
                  {w.headline}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{w.body}</p>
              </div>

              {/* Signals */}
              <div className="flex flex-wrap gap-2">
                {w.signals.map((s) => (
                  <span
                    key={s}
                    className="text-xs text-zinc-500 bg-white/[0.04] border border-white/8 px-2 py-0.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Real example */}
              <div className={`rounded-xl border p-4 text-xs text-zinc-400 leading-relaxed italic mt-auto ${w.exampleColor}`}>
                &ldquo;{w.example}&rdquo;
              </div>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="mt-12 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-7 py-3.5 rounded-xl text-sm transition-all shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
          >
            See all live opportunities →
          </a>
          <p className="text-xs text-zinc-600 mt-3">
            54 qualified targets live now · updated weekly · 100% developer contact found
          </p>
        </div>
      </div>
    </section>
  );
}
