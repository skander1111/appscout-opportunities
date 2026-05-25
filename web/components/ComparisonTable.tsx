const ROWS = [
  { label: "Discovery speed",       us: "Live · 247 / week",    flippa: "Manual browsing",   acquire: "Public listings only" },
  { label: "Off-market deals",      us: "Yes — primary focus",  flippa: "No",                acquire: "Rare" },
  { label: "AI scoring",            us: "8-axis Claude analysis", flippa: "None",            acquire: "None" },
  { label: "Outreach drafts",       us: "Included per deal",    flippa: "—",                 acquire: "—" },
  { label: "Direct dev contact",    us: "Yes (unblurred)",       flippa: "Broker-mediated",  acquire: "Listing-only" },
  { label: "Typical deal size",     us: "$500 – $25k",          flippa: "$5k – $250k",       acquire: "$25k – $5M" },
  { label: "Fees",                  us: "$9 – $119 one-time",   flippa: "10% commission",    acquire: "≥5% buyer fee" },
  { label: "How fast you can act",  us: "Same day",              flippa: "Days–weeks",       acquire: "Weeks" },
];

export default function ComparisonTable() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Why operators switch</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Off-market is where the{" "}
            <span className="shimmer-text">real margins</span> are
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Public marketplaces list what others have already seen. AppScout finds what they haven&apos;t — and tells you exactly how to act on it.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-[#1a1a26] bg-[#0a0a10]">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-0">
            {/* Headers */}
            <div className="p-4 border-b border-r border-[#1a1a26]"></div>
            <div className="p-4 border-b border-r border-[#1a1a26] text-center" style={{ background: "linear-gradient(180deg, rgba(0,255,136,0.08), transparent)" }}>
              <div className="text-[10px] uppercase tracking-widest text-neon font-mono mb-1">us</div>
              <div className="text-sm font-bold text-white">AppScout</div>
            </div>
            <div className="p-4 border-b border-r border-[#1a1a26] text-center">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mb-1">competitor</div>
              <div className="text-sm font-semibold text-zinc-400">Flippa</div>
            </div>
            <div className="p-4 border-b border-[#1a1a26] text-center">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mb-1">competitor</div>
              <div className="text-sm font-semibold text-zinc-400">Acquire.com</div>
            </div>

            {/* Rows */}
            {ROWS.map((r, i) => (
              <div key={r.label} className="contents">
                <div className={`p-4 text-sm text-zinc-300 font-medium ${i < ROWS.length - 1 ? "border-b" : ""} border-r border-[#1a1a26]`}>
                  {r.label}
                </div>
                <div
                  className={`p-4 text-sm font-semibold text-neon text-center ${i < ROWS.length - 1 ? "border-b" : ""} border-r border-[#1a1a26]`}
                  style={{ background: "linear-gradient(180deg, rgba(0,255,136,0.04), transparent)" }}
                >
                  {r.us}
                </div>
                <div className={`p-4 text-sm text-zinc-500 text-center ${i < ROWS.length - 1 ? "border-b" : ""} border-r border-[#1a1a26]`}>
                  {r.flippa}
                </div>
                <div className={`p-4 text-sm text-zinc-500 text-center ${i < ROWS.length - 1 ? "border-b" : ""} border-[#1a1a26]`}>
                  {r.acquire}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-600">
          Marketplaces compared based on public information as of {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
        </p>
      </div>
    </section>
  );
}
