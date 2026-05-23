const steps = [
  {
    number: "01",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
    title: "Engine scans 5 sources",
    description: "App Store and Google Play (19+ niches), Reddit seller posts, GitHub abandoned projects, Hacker News, and Product Hunt. Runs continuously — not just once a week.",
  },
  {
    number: "02",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    title: "AI classifies and scores",
    description: "Every find is scored on demand, abandonment, reachability, and monetization. Then classified: Acquire, Rebuild, or Partner — so you know what to do before you even open the listing.",
  },
  {
    number: "03",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Live dashboard updates",
    description: "Every qualified opportunity appears in your live dashboard — with the developer email, review complaints, and a one-click outreach draft. The dashboard refreshes every 60 seconds.",
  },
  {
    number: "04",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: "Weekly report every Friday",
    description: "Every Friday at 08:00, the best opportunities are frozen into a human-reviewed report — with full analysis, risk score, and outreach template. Delivered by email within minutes of purchase.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Four steps. Zero guesswork.</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Five sources, one engine, three plays — acquire, rebuild, or partner.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step) => (
            <div
              key={step.number}
              className="card-hover relative rounded-2xl p-6 bg-white/[0.03] border border-white/8"
              style={{ backdropFilter: "blur(4px)" }}
            >
              <div className="absolute top-4 right-5 text-5xl font-bold text-white/[0.04] font-mono select-none">
                {step.number}
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-neon mb-5"
                style={{
                  background: "rgba(0,255,136,0.07)",
                  border: "1px solid rgba(0,255,136,0.18)",
                }}
              >
                {step.icon}
              </div>
              <h3 className="text-base font-semibold mb-3 text-white">{step.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-6">
            Signals the engine detects across all sources
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "App last updated 12–36+ months ago",
              "Solo indie developer with public Gmail",
              "Reddit post: selling, struggling, or asking for advice",
              "1–2 star complaints: crashes, ads, outdated UI",
              "GitHub repo: stars and forks but no commits in 1+ year",
              "Developer email publicly listed on store page",
              "App still ranking in search despite no updates",
              "No reply to user reviews in 6+ months",
            ].map((signal) => (
              <div key={signal} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <span className="text-neon mt-0.5 flex-shrink-0">✓</span>
                {signal}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
