function ReportMockup() {
  const leads = [
    { name: "Tabata Timer: Interval Timer",   score: 90, installs: "5M+",  days: 420, owner: "Solo indie",  email: "evg███████@gmail.com" },
    { name: "Barcode Scanner – Price Finder", score: 85, installs: "5M+",  days: 545, owner: "Solo indie",  email: "ess███████@gmail.com" },
    { name: "Compass",                        score: 80, installs: "1M+",  days: 371, owner: "Solo indie",  email: "gra███████@gmail.com" },
  ];

  return (
    <div
      className="relative max-w-2xl mx-auto mt-12 rounded-2xl overflow-hidden border border-white/10 bg-[#0c1410]"
      style={{ boxShadow: "0 0 0 1px rgba(16,185,129,0.1), 0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(16,185,129,0.07)" }}
    >
      {/* Window bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
        </div>
        <span className="text-xs text-zinc-500 font-mono ml-2">AppScout Report — Week of May 21</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400 font-mono">24 opportunities</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2 border-b border-white/5">
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Opportunity</span>
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Score</span>
      </div>

      {/* Lead rows */}
      {leads.map((lead, i) => (
        <div key={i} className="px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/90 truncate">{lead.name}</div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1">
                <span className="text-[11px] text-zinc-500">{lead.installs} installs</span>
                <span className="text-zinc-700">·</span>
                <span className="text-[11px] text-zinc-500">{lead.days}d stale</span>
                <span className="text-zinc-700">·</span>
                <span className="text-[11px] text-emerald-600">{lead.owner}</span>
              </div>
              <div
                className="text-[11px] text-zinc-500 mt-1 select-none"
                style={{ filter: "blur(4px)" }}
              >
                {lead.email}
              </div>
            </div>
            <div
              className="flex-shrink-0 text-base font-bold text-emerald-400 mt-0.5"
              style={{ textShadow: "0 0 16px rgba(52,211,153,0.5)" }}
            >
              {lead.score}
            </div>
          </div>
        </div>
      ))}

      {/* Locked footer */}
      <div className="relative px-4 py-3 text-center">
        <div className="text-xs text-zinc-600">
          +10 more opportunities locked —{" "}
          <a href="#pricing" className="text-emerald-500 hover:text-emerald-400 transition-colors">
            unlock for €19 →
          </a>
        </div>
      </div>

      {/* Bottom glow */}
      <div
        className="absolute bottom-0 inset-x-0 h-1 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)" }}
      />
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative pt-24 pb-10 px-6 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Animated glow blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="blob-drift absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(16,185,129,0.14) 0%, transparent 65%)" }}
        />
        <div
          className="blob-drift-alt absolute top-[60px] left-[10%] w-[500px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(20,184,166,0.07) 0%, transparent 65%)" }}
        />
        <div
          className="blob-drift absolute top-[80px] right-[5%] w-[400px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(16,185,129,0.05) 0%, transparent 65%)" }}
        />
      </div>

      {/* Spotlight behind headline */}
      <div
        className="absolute top-0 left-0 right-0 -z-10 pointer-events-none h-[70%]"
        style={{ background: "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(16,185,129,0.1), transparent)" }}
      />

      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          266 apps scanned this week — 45 potential targets found
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up-delay-1 text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-5"
        >
          Find abandoned mobile apps{" "}
          <span
            className="text-emerald-400"
            style={{ textShadow: "0 0 50px rgba(52,211,153,0.4)" }}
          >
            before they hit Flippa
          </span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up-delay-2 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
          AppScout scans the App Store and Google Play every week to find apps with{" "}
          <span className="text-white font-medium">500k+ installs</span>,{" "}
          <span className="text-white font-medium">likely abandoned</span> for 1–3 years, and a{" "}
          <span className="text-white font-medium">reachable indie developer</span>.
          We score them, explain why they're interesting, and draft the outreach for you.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
          <a
            href="#pricing"
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_45px_rgba(16,185,129,0.45)]"
          >
            Get this week's report — €19
          </a>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto border border-white/10 hover:border-white/25 text-zinc-300 hover:text-white px-8 py-3.5 rounded-xl text-base transition-all"
          >
            See how it works →
          </a>
        </div>

        {/* Trust line */}
        <p className="animate-fade-up-delay-3 text-xs text-zinc-500">
          Human-reviewed before delivery · No public lead dump · Contact details stay locked
        </p>

        {/* Report mockup */}
        <ReportMockup />
      </div>
    </section>
  );
}
