// Illustrative scenarios based on real engine data. These show the playbook —
// not endorsed deals — so we mark them clearly as "playbook" or "scenario".

const STUDIES = [
  {
    tag: "ACQUIRE PLAYBOOK",
    color: "#00ff88",
    title: "5M installs · 546 days silent",
    sub: "Barcode Scanner – Price Finder",
    body: "Owner reachable. No competition for the listing. Buy quickly, modernize SDK + reactivate ad networks, drop a $4.99/mo Pro tier. AppScout's prior estimate: $18k acquisition cost, $1.2k/mo revenue range, 8-month breakeven.",
    stats: [
      { k: "Score",      v: "91" },
      { k: "Est. cost",  v: "~$18k" },
      { k: "Monthly",    v: "$0.8–1.8k" },
      { k: "Breakeven",  v: "~8 mo" },
    ],
  },
  {
    tag: "REBUILD PLAYBOOK",
    color: "#3b82f6",
    title: "200K rated 3.84 · drop-in fixable complaints",
    sub: "Any Ringtones (Android)",
    body: "Demand proven by half a million installs. Reviews show specific complaints — DRM bugs, intrusive ads. A clean rebuild captures the existing search traffic and skips the licensing risk. Outreach optional; you don't need permission to compete.",
    stats: [
      { k: "Score",     v: "72" },
      { k: "Build cost",v: "~$3k" },
      { k: "Monthly",   v: "$0.4–1.1k" },
      { k: "Breakeven", v: "~6 mo" },
    ],
  },
  {
    tag: "BUY PLAYBOOK",
    color: "#facc15",
    title: "Reddit ask · $4k · 10 days fresh",
    sub: "SendRight messaging utility",
    body: "Public seller on r/AppBusiness. Indie builder, named price, low information asymmetry. Run quick due-diligence on installs and revenue claims, then make a 30–40% discounted offer with a 7-day close. AppScout shows you fresh asks before they hit Flippa.",
    stats: [
      { k: "Score",     v: "74" },
      { k: "Ask",       v: "$4k" },
      { k: "Negotiate", v: "$2.5–3k" },
      { k: "Risk",      v: "Low" },
    ],
  },
];

export default function CaseStudyShowcase() {
  return (
    <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(251,191,36,0.05), transparent 70%)" }}
      />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-gold text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#fbbf24" }}>The Playbook</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Three ways operators turn AppScout into{" "}
            <span className="shimmer-text">cashflow</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Each plays maps to a tag the AI assigns automatically. Below: real opportunities currently live in the engine — illustrative of the playbook, not endorsements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STUDIES.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl bg-[#0a0a10] border border-[#1a1a26] p-6 flex flex-col hover:border-[#2a2a3e] transition-all"
            >
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded self-start mb-4"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                {s.tag}
              </span>

              <h3 className="text-xl font-bold text-white mb-1 leading-tight">{s.title}</h3>
              <p className="text-[12px] uppercase tracking-wider text-zinc-500 mb-4 font-mono">{s.sub}</p>

              <p className="text-sm text-zinc-400 leading-relaxed mb-5">{s.body}</p>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                {s.stats.map((stat) => (
                  <div key={stat.k} className="bg-[#070709] rounded-lg p-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600">{stat.k}</div>
                    <div className="text-sm font-bold tabular-nums" style={{ color: s.color }}>{stat.v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          ⚠ Numbers are AppScout&apos;s AI estimates — not financial guarantees. Always run independent due-diligence before acquiring an asset.
        </p>
      </div>
    </section>
  );
}
