"use client";
import TickerTape from "./TickerTape";
import VisitorCounter from "./VisitorCounter";

function ReportMockup() {
  const leads = [
    { name: "Tabata Timer: Interval Timer",   score: 90, installs: "5M+",  days: 421, play: "Acquire", email: "evg███████@gmail.com" },
    { name: "Barcode Scanner – Price Finder", score: 90, installs: "5M+",  days: 546, play: "Acquire", email: "ess███████@gmail.com" },
    { name: "10BA Pro Financial Calculator",  score: 90, installs: "100K+", days: 3149, play: "Acquire", email: "gra███████@gmail.com" },
  ];

  const playColor: Record<string, string> = {
    Acquire: "text-neon",
    Rebuild: "text-blue-400",
    Partner: "text-purple-400",
  };

  return (
    <div
      className="relative max-w-2xl mx-auto mt-14 rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(0,255,136,0.15)",
        background: "linear-gradient(160deg, #080c0a 0%, #060808 100%)",
        boxShadow: "0 0 0 1px rgba(0,255,136,0.06), 0 40px 80px rgba(0,0,0,0.6), 0 0 80px rgba(0,255,136,0.05)",
      }}
    >
      {/* Window bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.015]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-neon/40" />
        </div>
        <span className="text-[11px] text-zinc-500 font-mono ml-2">AppScout Intelligence — Week 21</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="relative flex h-2 w-2">
            <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
          </div>
          <span className="text-[11px] text-neon font-mono">54 live opportunities</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_60px_60px] gap-2 px-4 py-2 border-b border-white/5">
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest">App</span>
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest text-center">Play</span>
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest text-right">Score</span>
      </div>

      {leads.map((lead, i) => (
        <div key={i} className="px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
          <div className="grid grid-cols-[1fr_60px_60px] gap-2 items-center">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white/90 truncate">{lead.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-zinc-500">{lead.installs} installs</span>
                <span className="text-zinc-700">·</span>
                <span className="text-[11px] text-zinc-500">{lead.days.toLocaleString()}d stale</span>
              </div>
              <div className="text-[11px] text-zinc-600 mt-0.5 select-none" style={{ filter: "blur(3.5px)" }}>
                {lead.email}
              </div>
            </div>
            <span className={`text-[11px] font-bold text-center ${playColor[lead.play]}`}>{lead.play}</span>
            <div
              className="text-right text-base font-bold text-neon"
              style={{ textShadow: "0 0 20px rgba(0,255,136,0.7)" }}
            >
              {lead.score}
            </div>
          </div>
        </div>
      ))}

      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-zinc-600">+51 more locked</span>
        <a href="#pricing" className="text-xs text-neon hover:opacity-80 transition-opacity font-medium">
          Unlock full report — €19 →
        </a>
      </div>

      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.4), transparent)" }}
      />
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative pt-24 pb-10 px-6 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 -z-10 pointer-events-none grid-bg" />

      {/* Glow blobs — neon green */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="blob-drift absolute top-[-80px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(0,255,136,0.09) 0%, transparent 65%)" }}
        />
        <div
          className="blob-drift-alt absolute top-[100px] left-[5%] w-[500px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(0,255,136,0.05) 0%, transparent 65%)" }}
        />
        <div
          className="blob-drift absolute top-[120px] right-[5%] w-[400px] h-[350px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(0,204,106,0.04) 0%, transparent 65%)" }}
        />
      </div>

      {/* Spotlight */}
      <div
        className="absolute top-0 left-0 right-0 -z-10 pointer-events-none h-[60%]"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,136,0.07), transparent)" }}
      />

      <div className="max-w-4xl mx-auto text-center">

        {/* Live badge */}
        <div className="animate-fade-up flex justify-center mb-8">
          <div
            className="inline-flex items-center gap-2.5 text-xs font-semibold px-4 py-2 rounded-full"
            style={{
              background: "rgba(0,255,136,0.07)",
              border: "1px solid rgba(0,255,136,0.2)",
              color: "#00ff88",
            }}
          >
            <div className="relative flex h-2 w-2">
              <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
            </div>
            247 apps scanned this week · 54 qualified targets live
          </div>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up-delay-1 text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.06] tracking-tight mb-6">
          Find off-market app deals{" "}
          <span
            className="text-neon"
            style={{ textShadow: "0 0 60px rgba(0,255,136,0.5)" }}
          >
            before anyone else
          </span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up-delay-2 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6">
          AppScout scans abandoned mobile apps, public seller posts, and GitHub signals —
          then tells you whether to{" "}
          <span className="text-neon font-semibold">acquire</span>,{" "}
          <span className="text-blue-400 font-semibold">rebuild</span>, or{" "}
          <span className="text-purple-400 font-semibold">partner</span>.
          Every opportunity includes the developer&apos;s contact and a ready-to-send outreach draft.
        </p>

        {/* Pills */}
        <div className="animate-fade-up-delay-2 flex flex-wrap items-center justify-center gap-2 mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon bg-neon/10 border border-neon/20 px-3 py-1.5 rounded-full">
            🎯 Acquire — buy before it lists on Flippa
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
            🔨 Rebuild — proven demand, broken execution
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
            🤝 Partner — team up before they burn out
          </span>
        </div>

        {/* CTAs */}
        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
          <a
            href="#pricing"
            className="w-full sm:w-auto font-bold px-9 py-4 rounded-xl text-base transition-all text-black"
            style={{
              background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
              boxShadow: "0 0 40px rgba(0,255,136,0.4), 0 4px 20px rgba(0,0,0,0.3)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.boxShadow = "0 0 70px rgba(0,255,136,0.65), 0 4px 20px rgba(0,0,0,0.3)")}
            onMouseOut={(e) => (e.currentTarget.style.boxShadow = "0 0 40px rgba(0,255,136,0.4), 0 4px 20px rgba(0,0,0,0.3)")}
          >
            Get this week&apos;s report — €19
          </a>
          <a
            href="/dashboard"
            className="w-full sm:w-auto border px-9 py-4 rounded-xl text-base transition-all text-neon"
            style={{ borderColor: "rgba(0,255,136,0.3)" }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,136,0.6)")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,136,0.3)")}
          >
            Browse live dashboard →
          </a>
        </div>

        {/* LARGE visitor counter */}
        <div className="animate-fade-up-delay-4 flex flex-col items-center gap-2 py-8 mb-4">
          <div
            className="text-5xl sm:text-6xl font-bold tabular-nums animate-counter-glow"
            style={{ color: "#00ff88" }}
          >
            <VisitorCounter />
          </div>
          <p className="text-sm text-zinc-500 tracking-wide">founders already exploring opportunities</p>
        </div>

        {/* Trust line */}
        <p className="text-xs text-zinc-600">
          Human-reviewed · Developer emails included · No public lead dump
        </p>

        {/* Report mockup */}
        <ReportMockup />
      </div>

      <TickerTape />
    </section>
  );
}
