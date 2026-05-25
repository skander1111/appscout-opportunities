"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

interface NicheCell {
  niche: string;
  count: number;
  avgScore: number;
  avgDaysStale: number;
  totalInstalls: number;
  topActions: Record<string, number>;
}

function topAction(actions: Record<string, number>): string {
  const entries = Object.entries(actions).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || "watch";
}

const ACTION_COLOR: Record<string, string> = {
  acquire: "#00ff88",
  rebuild: "#3b82f6",
  partner: "#a855f7",
  buy:     "#facc15",
  watch:   "#71717a",
  ignore:  "#52525b",
};

export default function NichesPage() {
  const [niches, setNiches] = useState<NicheCell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/niches")
      .then((r) => r.json())
      .then((d) => setNiches(d.niches || []))
      .finally(() => setLoading(false));
  }, []);

  const maxCount = niches[0]?.count || 1;
  const maxScore = Math.max(...niches.map((n) => n.avgScore), 1);

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-2">Niche heat map</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Which categories are running hot</h1>
            <p className="text-zinc-400">
              Size = opportunity count. Color intensity = average AI opportunity score. Top action = what the AI recommends most for this niche.
            </p>
          </div>

          {loading ? (
            <p className="text-zinc-500 text-sm">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {niches.map((n) => {
                  const scoreIntensity = n.avgScore / maxScore;
                  const sizeIntensity = n.count / maxCount;
                  const action = topAction(n.topActions);
                  const color = ACTION_COLOR[action] || "#71717a";
                  return (
                    <a
                      key={n.niche}
                      href={`/terminal?niche=${encodeURIComponent(n.niche)}`}
                      className="block bg-[#0a0a10] border rounded-xl p-4 hover:border-[#3a3a4e] transition-all"
                      style={{
                        borderColor: `${color}${Math.round(scoreIntensity * 50).toString(16).padStart(2, "0")}`,
                        background: `radial-gradient(circle at top right, ${color}${Math.round(scoreIntensity * 22).toString(16).padStart(2, "0")}, #0a0a10 70%)`,
                        minHeight: `${100 + sizeIntensity * 70}px`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">{n.niche}</h3>
                        <span className="text-[9px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded" style={{ color, background: `${color}15` }}>{action}</span>
                      </div>
                      <div className="text-2xl font-bold tabular-nums mb-1" style={{ color }}>
                        {n.count}
                      </div>
                      <div className="text-[10px] text-zinc-500 leading-tight space-y-0.5">
                        <div>avg score <span className="text-zinc-300 tabular-nums">{n.avgScore}</span></div>
                        <div>avg stale <span className="text-zinc-300 tabular-nums">{n.avgDaysStale}d</span></div>
                        {n.totalInstalls > 0 && <div>installs <span className="text-zinc-300 tabular-nums">{n.totalInstalls.toLocaleString()}</span></div>}
                      </div>
                    </a>
                  );
                })}
              </div>

              <p className="mt-8 text-[11px] text-zinc-600 text-center">
                Click any cell to filter the terminal to that niche. {niches.length} niches tracked.
              </p>
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
