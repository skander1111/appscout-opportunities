"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TerminalCard from "@/components/TerminalCard";
import type { Opportunity } from "@/lib/opportunities";
import { getWatchlist } from "@/lib/watchlist";

interface Pulse {
  date: string;
  counts: {
    total: number;
    newToday: number;
    freshSignals: number;
    hotLeads: number;
    watched: number;
  };
  sections: {
    newToday: Opportunity[];
    freshSignals: Opportunity[];
    hotLeads: Opportunity[];
    watched: Opportunity[];
    topAi: Opportunity[];
  };
}

function StatCard({ label, value, color = "#00ff88" }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-[#0a0a10] border border-[#1a1a26] rounded-xl px-4 py-3">
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function Section({ title, items, hint }: { title: string; items: Opportunity[]; hint: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-[10px] text-zinc-500 font-mono">{hint}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((o) => (
          <TerminalCard key={o.id} opportunity={o} unlocked={true} />
        ))}
      </div>
    </section>
  );
}

export default function PulsePage() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const watchlist = getWatchlist();
    fetch("/api/pulse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watchlist }),
    })
      .then((r) => r.json())
      .then((data) => setPulse(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-2">Daily Pulse</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Today across all sources</h1>
            <p className="text-zinc-400">
              60-second briefing on what changed. New opportunities, hot leads, watchlist alerts, and the AI&apos;s top picks.
            </p>
          </div>

          {loading || !pulse ? (
            <p className="text-zinc-500 text-sm">Loading today&apos;s pulse…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-12">
                <StatCard label="Total tracked" value={pulse.counts.total} color="#a1a1aa" />
                <StatCard label="New today"     value={pulse.counts.newToday} />
                <StatCard label="Fresh signals" value={pulse.counts.freshSignals} color="#a855f7" />
                <StatCard label="Hot leads"     value={pulse.counts.hotLeads} color="#facc15" />
                <StatCard label="Watching"      value={pulse.counts.watched} color="#3b82f6" />
              </div>

              <Section title="★ Your watchlist"     items={pulse.sections.watched}      hint="updates on items you pinned" />
              <Section title="⚡ New today"          items={pulse.sections.newToday}     hint="added in last 24h" />
              <Section title="🔥 Hot seller leads"   items={pulse.sections.hotLeads}     hint="public asks ≤ 14d old" />
              <Section title="📡 Fresh signals"      items={pulse.sections.freshSignals} hint="≤ 2d old" />
              <Section title="🏆 Top AI picks today" items={pulse.sections.topAi}        hint="highest opportunity score" />
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
