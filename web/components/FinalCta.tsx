export default function FinalCta() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,255,136,0.10), transparent 70%)" }}
      />
      <div className="absolute inset-0 -z-10 grid-bg opacity-40" />

      <div className="max-w-3xl mx-auto text-center">
        <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-4">Start scouting</p>

        <h2 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
          The best app you&apos;ll ever buy is{" "}
          <span className="shimmer-text">already abandoned</span>
        </h2>

        <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          You just don&apos;t know which one yet. AppScout already does.
          $9 buys you 24 hours to find out.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <a
            href="#pricing"
            className="font-bold px-9 py-4 rounded-xl text-base text-black"
            style={{
              background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
              boxShadow: "0 0 50px rgba(0,255,136,0.45)",
            }}
          >
            Get day pass — $9 →
          </a>
          <a
            href="/terminal"
            className="font-semibold px-9 py-4 rounded-xl text-base text-neon border transition-all"
            style={{ borderColor: "rgba(0,255,136,0.3)" }}
          >
            Browse free first
          </a>
        </div>

        <p className="text-xs text-zinc-600">
          No subscription · No auto-renew · License expires automatically
        </p>
      </div>
    </section>
  );
}
