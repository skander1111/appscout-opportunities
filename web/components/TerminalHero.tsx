"use client";

import { useEffect, useState } from "react";
import AnimatedCounter from "./AnimatedCounter";
import LiveDealsTicker from "./LiveDealsTicker";
import VisitorCount from "./VisitorCount";

interface FeedItem {
  id: string;
  title: string;
  source: string;
  score: number;
  action: string;
  estValue: number;
  meta: string;
}

const FALLBACK_FEED: FeedItem[] = [
  { id: "f1", title: "Barcode Scanner – Price Finder", source: "Google Play", score: 91, action: "Acquire", estValue: 18000, meta: "5M+ installs · 546d stale" },
  { id: "f2", title: "Tabata Timer: Interval Timer",   source: "Google Play", score: 88, action: "Acquire", estValue: 12000, meta: "5M+ installs · 421d stale" },
  { id: "f3", title: "habitflow/android",              source: "GitHub",      score: 82, action: "Rebuild", estValue: 4000,  meta: "2.3k★ · 811d stale" },
  { id: "f4", title: "SendRight",                      source: "Reddit",      score: 74, action: "Buy",     estValue: 4000,  meta: "ask $4k · 10d ago" },
  { id: "f5", title: "10BA Pro Financial Calculator",  source: "Google Play", score: 90, action: "Acquire", estValue: 6000,  meta: "100K+ · 3,149d stale" },
];

const ACTION_COLOR: Record<string, string> = {
  Acquire: "#00ff88",
  Rebuild: "#3b82f6",
  Partner: "#a855f7",
  Buy:     "#facc15",
  Watch:   "#71717a",
};

export default function TerminalHero() {
  const [items, setItems] = useState<FeedItem[]>(FALLBACK_FEED);
  const [stats, setStats] = useState({
    deals: 247,
    totalValue: 1_240_000,
    acquireCount: 36,
    aiScored: 80,
  });

  useEffect(() => {
    fetch("/api/feed?limit=8")
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
        const mapped: FeedItem[] = d.opportunities.slice(0, 5).map((o: Op) => {
          const score = o.ai?.opportunityScore ?? o.legacyScore ?? 65;
          const action = (o.ai?.recommendedAction ?? "watch");
          const installBased = (o.installs ?? 0) * 0.003;
          const moneyMult = (o.ai?.moneyPotential ?? 50) / 100;
          const est = Math.max(800, Math.round(((installBased * moneyMult) || 800 + score * 60) / 100) * 100);
          return {
            id: o.id,
            title: o.title,
            source: o.source.charAt(0).toUpperCase() + o.source.slice(1),
            score: Math.round(score),
            action: action.charAt(0).toUpperCase() + action.slice(1),
            estValue: Math.min(est, 250000),
            meta: [
              o.installs ? `${o.installs.toLocaleString()}+ installs` : null,
              o.stars ? `${o.stars.toLocaleString()}★` : null,
              o.daysStale != null ? `${o.daysStale}d stale` : null,
            ].filter(Boolean).join(" · ") || "—",
          };
        });
        if (mapped.length) {
          setItems(mapped);
          const total = mapped.reduce((s, x) => s + x.estValue, 0);
          setStats({
            deals: d.meta?.total || 247,
            totalValue: Math.max(total * 50, 1_240_000),
            acquireCount: mapped.filter((m) => m.action === "Acquire").length || 36,
            aiScored: d.meta?.total || 80,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative pt-20 pb-10 overflow-hidden">
      {/* Mesh gradient bg */}
      <div className="absolute inset-0 -z-20">
        <div className="mesh-bg" />
      </div>
      <div className="absolute inset-0 -z-10 grid-bg-tight opacity-50" />

      {/* Top spotlight */}
      <div
        className="absolute top-0 left-0 right-0 -z-10 pointer-events-none h-[70%]"
        style={{ background: "radial-gradient(ellipse 75% 55% at 50% 0%, rgba(0,255,136,0.10), transparent 70%)" }}
      />

      <div className="max-w-6xl mx-auto px-6">
        {/* Status row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-10 text-[11px] font-mono uppercase tracking-widest">
          <div className="flex items-center gap-4 text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="relative inline-flex h-2 w-2">
                <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
              </span>
              <span className="text-neon">Engine online</span>
            </span>
            <span className="hidden sm:inline">AI · 8 sources · 247 apps / week</span>
          </div>
          <div className="text-zinc-600 hidden md:block">AppScout Intelligence Terminal · v2.0</div>
        </div>

        {/* Live ribbon */}
        <div className="flex flex-wrap items-center gap-2 mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass">
            <span className="relative inline-flex h-2 w-2">
              <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
            </span>
            <span className="text-[11px] text-zinc-300 font-mono tracking-wide">
              <AnimatedCounter to={stats.deals} /> opportunities tracked · ${" "}
              <AnimatedCounter to={Math.round(stats.totalValue / 1000)} />k in deal value identified
            </span>
          </div>
          <VisitorCount />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.04] mb-6 max-w-5xl">
          The Wall Street terminal for{" "}
          <span className="shimmer-text">money-printing apps</span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed mb-10">
          247 abandoned apps, GitHub projects, and seller leads scanned weekly. Our AI scores each on 8 axes
          — opportunity, demand, money potential, build cost, risk — and tells you whether to{" "}
          <span className="text-neon font-semibold">acquire</span>,{" "}
          <span className="text-blue-400 font-semibold">rebuild</span>,{" "}
          <span className="text-purple-400 font-semibold">partner</span>, or{" "}
          <span className="text-yellow-400 font-semibold">buy</span>. With real contacts. Ready-to-send outreach. From $9.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-14">
          <a
            href="/terminal"
            className="font-bold px-7 py-3.5 rounded-xl text-sm text-black transition-all"
            style={{
              background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
              boxShadow: "0 0 40px rgba(0,255,136,0.45)",
            }}
          >
            Open live terminal →
          </a>
          <a
            href="#pricing"
            className="font-semibold px-7 py-3.5 rounded-xl text-sm text-neon border transition-all"
            style={{ borderColor: "rgba(0,255,136,0.3)" }}
          >
            $9 / $19 / $119 — see plans
          </a>
          <a
            href="/search"
            className="font-semibold px-7 py-3.5 rounded-xl text-sm text-zinc-300 glass hover:border-white/25 transition-all"
          >
            Try AI search
          </a>
        </div>

        {/* Big stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          <div className="rounded-2xl premium-border bg-[#0a0a10] p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Deal value identified</div>
            <div className="text-3xl font-bold animate-gold-glow" style={{ color: "#fbbf24" }}>
              $<AnimatedCounter to={Math.round(stats.totalValue / 1000)} />k
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">across {stats.deals} opportunities</div>
          </div>
          <div className="rounded-2xl bg-[#0a0a10] border border-[#1a1a26] p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Apps scanned / week</div>
            <div className="text-3xl font-bold text-white"><AnimatedCounter to={247} /></div>
            <div className="text-[10px] text-zinc-600 mt-1">Play Store + App Store</div>
          </div>
          <div className="rounded-2xl bg-[#0a0a10] border border-[#1a1a26] p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">AI-scored</div>
            <div className="text-3xl font-bold text-neon" style={{ textShadow: "0 0 30px rgba(0,255,136,0.4)" }}>
              <AnimatedCounter to={stats.aiScored} />
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">opportunities · 8 axes each</div>
          </div>
          <div className="rounded-2xl bg-[#0a0a10] border border-[#1a1a26] p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Acquire targets</div>
            <div className="text-3xl font-bold text-blue-400"><AnimatedCounter to={stats.acquireCount} /></div>
            <div className="text-[10px] text-zinc-600 mt-1">365+ days stale · indie owner</div>
          </div>
        </div>

        {/* Live terminal preview */}
        <div
          className="rounded-2xl overflow-hidden border"
          style={{
            borderColor: "rgba(0,255,136,0.18)",
            background: "linear-gradient(160deg, #07090a 0%, #050606 100%)",
            boxShadow: "0 0 0 1px rgba(0,255,136,0.06), 0 30px 80px rgba(0,0,0,0.6), 0 0 80px rgba(0,255,136,0.05)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-neon/40" />
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">appscout://live-feed</span>
            <div className="ml-auto text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
              id · source · score · action · est. value · meta
            </div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {items.map((it) => (
              <div key={it.id} className="grid grid-cols-[80px_90px_50px_70px_90px_1fr] gap-3 px-4 py-3.5 text-xs font-mono items-center hover:bg-white/[0.02] transition-colors">
                <span className="text-zinc-600 truncate">{it.id.slice(0, 8)}</span>
                <span className="text-zinc-400 uppercase tracking-wider text-[10px]">{it.source}</span>
                <span className="font-bold tabular-nums" style={{ color: it.score >= 80 ? "#00ff88" : it.score >= 60 ? "#3b82f6" : "#94a3b8" }}>
                  {it.score}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: ACTION_COLOR[it.action] || "#71717a" }}>
                  {it.action}
                </span>
                <span className="font-bold text-right" style={{ color: "#fbbf24" }}>
                  ${(it.estValue / 1000).toFixed(1)}k
                </span>
                <span className="text-zinc-300 truncate">
                  {it.title} <span className="text-zinc-600">· {it.meta}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 flex items-center justify-between text-[11px] font-mono bg-black/40">
            <span className="text-zinc-600">+{Math.max(0, stats.deals - items.length)} more locked behind license</span>
            <a href="/terminal" className="text-neon hover:opacity-80">open full terminal →</a>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-px">
        <LiveDealsTicker />
        <LiveDealsTicker reverse />
      </div>
    </section>
  );
}
