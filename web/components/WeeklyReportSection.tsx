const SECTIONS = [
  { letter: "A", title: "Hidden app acquisition targets", desc: "Off-market apps with reachable owners" },
  { letter: "B", title: "Rebuild opportunities",          desc: "Proven demand, broken execution" },
  { letter: "C", title: "GitHub unfinished projects",     desc: "Stars + traction, stale repos" },
  { letter: "D", title: "Public seller leads",            desc: "Reddit + forum posts asking buyers" },
  { letter: "E", title: "Startup / news / trend signals", desc: "HN + PH + IH movement" },
  { letter: "F", title: "Project marketplace submissions",desc: "Vetted user-uploaded projects" },
  { letter: "G", title: "AI predictions + money potential", desc: "Scored across 8 dimensions" },
];

export default function WeeklyReportSection() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Weekly intelligence report</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Every Friday · 08:00</h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            We freeze the week&apos;s best signals into a clean PDF with seven sections,
            AI scores, contacts, and outreach drafts. Polished and human-reviewed before publish.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {SECTIONS.map((s) => (
            <div
              key={s.letter}
              className="flex gap-4 items-start bg-[#0a0a10] border border-[#1a1a26] rounded-xl p-4"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-black flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
                  boxShadow: "0 0 18px rgba(0,255,136,0.25)",
                }}
              >
                {s.letter}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{s.title}</div>
                <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="#pricing"
            className="inline-block font-bold px-7 py-3.5 rounded-xl text-sm text-black"
            style={{
              background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
              boxShadow: "0 0 25px rgba(0,255,136,0.4)",
            }}
          >
            Get this Friday&apos;s report — $9
          </a>
          <p className="text-xs text-zinc-600 mt-3">
            Reports refresh weekly. Subscribers get the next one automatically.
          </p>
        </div>
      </div>
    </section>
  );
}
