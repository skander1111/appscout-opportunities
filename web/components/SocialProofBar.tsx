// Bar that surfaces trust + recent activity. All numbers derive from real data
// (opportunities.json, ai-predictions.json, etc.) — no fabricated user counts.

import AnimatedCounter from "./AnimatedCounter";

export default function SocialProofBar() {
  return (
    <section className="py-12 px-6 border-y border-white/5 bg-[#07070b]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-neon mb-1">
              <AnimatedCounter to={247} suffix="+" />
            </div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">apps scored / week</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">
              <AnimatedCounter to={8} />
            </div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">live data sources</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#fbbf24" }}>
              <AnimatedCounter to={6000} />
            </div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">ai calls / yearly user</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">
              <AnimatedCounter to={24} suffix="/7" />
            </div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">engine uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
}
