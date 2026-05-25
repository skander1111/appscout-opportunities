"use client";

import { useEffect, useState } from "react";

interface DealRow {
  id: string;
  title: string;
  source: string;
  score: number;
  action: string;
  installs?: number;
  stars?: number;
  daysStale?: number;
  estimatedValue?: number;
}

const FALLBACK: DealRow[] = [
  { id: "f1", title: "Barcode Scanner – Price Finder", source: "Google Play",   score: 91, action: "acquire", installs: 5_000_000, daysStale: 546, estimatedValue: 18000 },
  { id: "f2", title: "Tabata Timer: Interval Timer",   source: "Google Play",   score: 88, action: "acquire", installs: 5_000_000, daysStale: 421, estimatedValue: 12000 },
  { id: "f3", title: "habitflow/android",              source: "GitHub",        score: 82, action: "rebuild", stars: 2300,        daysStale: 811, estimatedValue: 4000 },
  { id: "f4", title: "SendRight (Reddit ask $4k)",     source: "Reddit",        score: 74, action: "buy",                          daysStale: 10,  estimatedValue: 4000 },
  { id: "f5", title: "PDF scanner — for sale",         source: "Reddit",        score: 71, action: "buy",                          daysStale: 3,   estimatedValue: 850 },
  { id: "f6", title: "10BA Pro Financial Calculator",  source: "Google Play",   score: 90, action: "acquire", installs: 100_000,   daysStale: 3149, estimatedValue: 6000 },
  { id: "f7", title: "Simple Habit: Meditation",       source: "Google Play",   score: 78, action: "acquire", installs: 1_000_000, daysStale: 537, estimatedValue: 22000 },
  { id: "f8", title: "ZenMeditate — abandoned",        source: "GitHub",        score: 76, action: "rebuild", stars: 1840,         daysStale: 612, estimatedValue: 3500 },
];

const ACTION_COLOR: Record<string, string> = {
  acquire: "#00ff88",
  rebuild: "#3b82f6",
  partner: "#a855f7",
  buy:     "#facc15",
  watch:   "#71717a",
};

function formatValue(d: DealRow): string {
  if (d.estimatedValue) return `$${d.estimatedValue.toLocaleString()}`;
  if (d.installs) return `${(d.installs / 1000).toFixed(0)}k installs`;
  if (d.stars) return `${d.stars}★`;
  return "—";
}

export default function LiveDealsTicker({ reverse }: { reverse?: boolean }) {
  const [deals, setDeals] = useState<DealRow[]>(FALLBACK);

  useEffect(() => {
    fetch("/api/feed?limit=14")
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d.opportunities)) return;
        type Op = {
          id: string;
          title: string;
          source: string;
          ai?: { opportunityScore?: number; recommendedAction?: string; moneyPotential?: number };
          legacyScore?: number;
          installs?: number;
          stars?: number;
          daysStale?: number;
        };
        const mapped: DealRow[] = d.opportunities.map((o: Op) => {
          const ai = o.ai;
          const score = ai?.opportunityScore ?? o.legacyScore ?? 65;
          // Estimate deal value heuristically when AI moneyPotential isn't exposed
          const installBased = (o.installs ?? 0) * 0.003;
          const moneyMult = (ai?.moneyPotential ?? 50) / 100;
          const est = Math.round(((installBased * moneyMult) || 1500 + score * 80) / 100) * 100;
          return {
            id: o.id,
            title: o.title,
            source: o.source.charAt(0).toUpperCase() + o.source.slice(1),
            score: Math.round(score),
            action: ai?.recommendedAction ?? "watch",
            installs: o.installs,
            stars: o.stars,
            daysStale: o.daysStale,
            estimatedValue: Math.min(est, 250000),
          };
        });
        if (mapped.length) setDeals(mapped);
      })
      .catch(() => {});
  }, []);

  const items = [...deals, ...deals, ...deals];
  const animClass = reverse ? "animate-ticker-reverse" : "animate-ticker";

  return (
    <div
      className="relative overflow-hidden py-3"
      style={{
        borderTop: "1px solid rgba(0,255,136,0.08)",
        borderBottom: "1px solid rgba(0,255,136,0.08)",
        background: "linear-gradient(180deg, rgba(0,255,136,0.025), rgba(0,0,0,0))",
      }}
    >
      <div className={`flex items-center gap-0 whitespace-nowrap ${animClass}`}>
        {items.map((d, i) => {
          const color = ACTION_COLOR[d.action] || "#71717a";
          return (
            <span key={i} className="inline-flex items-center gap-2.5 px-6 text-xs">
              <span style={{ color, opacity: 0.7 }}>◆</span>
              <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-mono">{d.source}</span>
              <span className="text-zinc-200 font-medium">{d.title}</span>
              <span className="font-bold tabular-nums" style={{ color: d.score >= 80 ? "#00ff88" : d.score >= 60 ? "#3b82f6" : "#94a3b8" }}>
                {d.score}
              </span>
              <span style={{ color }} className="text-[10px] uppercase tracking-widest font-semibold">{d.action}</span>
              <span className="text-gold font-bold" style={{ color: "#fbbf24" }}>{formatValue(d)}</span>
              <span className="text-zinc-700">|</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
