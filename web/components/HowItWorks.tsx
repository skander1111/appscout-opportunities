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
    title: "Scan app stores",
    description:
      "Our engine searches 20+ niches — timers, habit trackers, PDF readers, compass tools, flashcards — and pulls full app data: installs, rating, last update, and developer contact info.",
  },
  {
    number: "02",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    title: "Score every opportunity",
    description:
      "Each app gets an Opportunity Score based on demand signals, abandonment age, owner type (solo indie vs. big company), review complaints, and monetization potential. Big companies are filtered automatically.",
  },
  {
    number: "03",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: "Get a deal-ready report",
    description:
      "Top acquisition targets and rebuild opportunities land in your inbox as a structured report — with the developer's email, the reason it's interesting, a risk assessment, and a ready-to-send outreach email.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            From raw App Store and Play Store data to a deal-ready report in minutes.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div
              key={step.number}
              className="card-hover relative rounded-2xl p-6 bg-white/[0.03] border border-white/8"
              style={{ backdropFilter: "blur(4px)" }}
            >
              {/* Step number watermark */}
              <div className="absolute top-4 right-5 text-5xl font-bold text-white/[0.04] font-mono select-none">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                {step.icon}
              </div>

              <h3 className="text-base font-semibold mb-3 text-white">{step.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Abandonment signals */}
        <div className="mt-10 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-6">
            Abandonment signals we detect
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Last update 12–36+ months ago",
              "Solo indie developer (Gmail contact)",
              "500k–10M installs with declining reviews",
              "1–2 star complaints: crashes, outdated UI, too many ads",
              "No recent changelog activity",
              "Developer email publicly listed",
              "App still ranking in search results",
              "No reply to user reviews in 6+ months",
            ].map((signal) => (
              <div key={signal} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                {signal}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
