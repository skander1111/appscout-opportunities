const TYPES = [
  { icon: "💰", label: "I want to sell",          gradient: "from-yellow-500/15 to-yellow-500/5" },
  { icon: "🤝", label: "I want a partner",        gradient: "from-purple-500/15 to-purple-500/5" },
  { icon: "🔨", label: "I want a builder",        gradient: "from-blue-500/15 to-blue-500/5" },
  { icon: "💸", label: "I want investors",        gradient: "from-emerald-500/15 to-emerald-500/5" },
  { icon: "💬", label: "I want feedback",         gradient: "from-pink-500/15 to-pink-500/5" },
];

export default function SubmitProjectTeaser() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Project marketplace</p>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Submit your app, idea, or unfinished project</h2>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-12">
          Looking for a buyer, partner, builder, investor, or feedback? Submit your project and
          AppScout matches it with the right operators in our network.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
          {TYPES.map((t) => (
            <div
              key={t.label}
              className={`bg-gradient-to-br ${t.gradient} border border-white/10 rounded-xl p-4 hover:border-white/25 transition-colors`}
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="text-xs text-zinc-300 font-medium">{t.label}</div>
            </div>
          ))}
        </div>

        <a
          href="/submit"
          className="inline-block font-bold px-7 py-3.5 rounded-xl text-sm text-black"
          style={{
            background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
            boxShadow: "0 0 25px rgba(0,255,136,0.4)",
          }}
        >
          Submit your project →
        </a>
        <p className="text-xs text-zinc-600 mt-3">
          Free to submit. Yearly members get priority review and buyer matching.
        </p>
      </div>
    </section>
  );
}
