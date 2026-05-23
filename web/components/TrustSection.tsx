const items = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: "No spam outreach",
    body: "We only surface solo indie developers and small studios. Big companies and portfolio aggregators are filtered out automatically.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Hidden before Flippa",
    body: "These deals don't appear on public marketplaces yet. You reach out before the seller lists — which means lower competition and lower prices.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: "Real verified contacts",
    body: "Developer contacts come directly from App Store and Play Store listings — not guessed or generated. Low-reachability apps are flagged in every report.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Human-reviewed data",
    body: "Our scoring model is tuned weekly. Every report is checked before delivery — we don't ship a list of 200 mediocre apps and call it done.",
  },
];

export default function TrustSection() {
  return (
    <section className="py-20 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Built for serious operators</h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-base">
            Not a data dump. Every opportunity is classified, scored, and ready to act on.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <div
              key={item.title}
              className="card-hover rounded-2xl p-5 bg-white/[0.02] border border-white/5"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-neon mb-4"
                style={{
                  background: "rgba(0,255,136,0.07)",
                  border: "1px solid rgba(0,255,136,0.14)",
                }}
              >
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
