"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TerminalCard from "@/components/TerminalCard";
import type { Opportunity, OpportunityKind, AccessTier } from "@/lib/opportunities";
import { accessFor } from "@/lib/opportunities";

const KIND_FILTERS: { id: "all" | OpportunityKind; label: string; icon: string }[] = [
  { id: "all",              label: "All",            icon: "⚡" },
  { id: "abandoned-app",    label: "Abandoned apps", icon: "🎯" },
  { id: "rebuild-target",   label: "Rebuild",        icon: "🔨" },
  { id: "github-stale",     label: "GitHub",         icon: "⚗️" },
  { id: "seller-lead",      label: "Seller leads",   icon: "💬" },
  { id: "startup-signal",   label: "Signals",        icon: "📡" },
  { id: "partner-request",  label: "Partners",       icon: "🤝" },
  { id: "user-submission",  label: "Marketplace",    icon: "🏪" },
];

type SortMode = "score" | "stale" | "new";

export default function TerminalPage() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | OpportunityKind>("all");
  const [sort, setSort] = useState<SortMode>("score");
  const [tier, setTier] = useState<AccessTier>("free");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    // Demo-mode: tier from localStorage so paying users can preview.
    try {
      const stored = (localStorage.getItem("appscout.tier") as AccessTier) || "free";
      if (["free", "report", "monthly", "yearly"].includes(stored)) setTier(stored);
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/feed?limit=200", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setOpps(data.opportunities || []);
        setLastRefresh(new Date());
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const filtered = useMemo(() => {
    let list = opps;
    if (filter !== "all") list = list.filter((o) => o.kind === filter);
    if (sort === "score") list = [...list].sort((a, b) => (b.ai?.opportunityScore ?? b.legacyScore ?? 0) - (a.ai?.opportunityScore ?? a.legacyScore ?? 0));
    else if (sort === "stale") list = [...list].sort((a, b) => (b.daysStale ?? 0) - (a.daysStale ?? 0));
    else if (sort === "new") list = [...list].sort((a, b) => (a.daysStale ?? 9999) - (b.daysStale ?? 9999));
    return list;
  }, [opps, filter, sort]);

  const rules = accessFor(tier);
  const visible = filtered.slice(0, rules.maxCardsVisible === Infinity ? filtered.length : rules.maxCardsVisible);
  const hiddenCount = filtered.length - visible.length;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: opps.length };
    for (const o of opps) c[o.kind] = (c[o.kind] || 0) + 1;
    return c;
  }, [opps]);

  function timeAgo(d: Date | null) {
    if (!d) return "—";
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />

      <div className="pt-16">
        {/* terminal header */}
        <div className="border-b border-[#1a1a26] bg-[#07070b]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  App<span className="text-neon">Scout</span> Terminal
                </h1>
                <p className="text-zinc-500 text-xs mt-1 font-mono">
                  live feed · refreshing every 60s · last update {timeAgo(lastRefresh)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="text-[10px] uppercase tracking-widest bg-[#0a0a10] border border-[#1a1a26] rounded-md px-2 py-1 text-zinc-400 font-mono"
                  value={tier}
                  onChange={(e) => {
                    const t = e.target.value as AccessTier;
                    setTier(t);
                    try { localStorage.setItem("appscout.tier", t); } catch {}
                  }}
                >
                  <option value="free">tier: free</option>
                  <option value="report">tier: one report</option>
                  <option value="monthly">tier: monthly</option>
                  <option value="yearly">tier: yearly</option>
                </select>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-neon">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
                  </span>
                  engine online
                </div>
              </div>
            </div>

            {/* stat grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {KIND_FILTERS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setFilter(k.id)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                    filter === k.id
                      ? "border-neon/40 bg-neon/5 text-neon"
                      : "border-[#1a1a26] bg-[#0a0a10] text-zinc-400 hover:border-[#2a2a3e]"
                  }`}
                >
                  <div className="text-base font-bold tabular-nums">{counts[k.id === "all" ? "all" : k.id] ?? 0}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5">{k.icon} {k.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* toolbar */}
        <div className="border-b border-[#1a1a26] sticky top-16 z-30 bg-[#050508]/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-[#0a0a10] border border-[#1a1a26] rounded-lg p-1">
              {(["score", "stale", "new"] as SortMode[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`text-[11px] px-3 py-1.5 rounded-md transition-colors font-mono uppercase tracking-wider ${
                    sort === s ? "bg-neon/15 text-neon" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {s === "score" ? "by score" : s === "stale" ? "stalest" : "newest"}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-zinc-600 font-mono">{filtered.length} results</span>
            {tier === "free" && (
              <span className="ml-auto text-[11px] text-zinc-500">
                Showing {visible.length} of {filtered.length} —{" "}
                <a href="/#pricing" className="text-neon hover:opacity-80">unlock everything →</a>
              </span>
            )}
          </div>
        </div>

        {/* feed */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {loading ? (
            <div className="text-center py-32">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
                style={{ borderColor: "rgba(0,255,136,0.2)", borderTopColor: "#00ff88" }}
              />
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">loading feed…</p>
            </div>
          ) : (
            <>
              {visible.length === 0 && (
                <div className="text-center py-24 border border-dashed border-[#1a1a26] rounded-xl">
                  <p className="text-xs text-zinc-500">No opportunities for this filter yet</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visible.map((o) => (
                  <TerminalCard
                    key={o.id}
                    opportunity={o}
                    unlocked={rules.showAdvancedAi || (rules.showFullContact && rules.showAiPrediction)}
                  />
                ))}
              </div>

              {hiddenCount > 0 && (
                <div
                  className="mt-8 rounded-xl p-8 text-center border"
                  style={{
                    borderColor: "rgba(0,255,136,0.2)",
                    background: "linear-gradient(160deg, rgba(0,255,136,0.04), transparent)",
                  }}
                >
                  <p className="text-sm text-zinc-300 mb-3">
                    🔒 <span className="font-semibold">{hiddenCount} more opportunities</span> available with Monthly or Yearly access.
                  </p>
                  <a
                    href="/#pricing"
                    className="inline-block text-sm font-bold text-black px-6 py-3 rounded-lg"
                    style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)", boxShadow: "0 0 25px rgba(0,255,136,0.35)" }}
                  >
                    Unlock everything from $9 →
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
