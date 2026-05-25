"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TerminalCard from "@/components/TerminalCard";
import type { Opportunity } from "@/lib/opportunities";
import { getWatchlist } from "@/lib/watchlist";

export default function WatchlistPage() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  async function load() {
    const ids = getWatchlist();
    if (ids.length === 0) { setEmpty(true); setLoading(false); return; }
    try {
      const res = await fetch("/api/feed?limit=500");
      const data = await res.json();
      const all = (data.opportunities || []) as Opportunity[];
      setOpps(all.filter((o) => ids.includes(o.id)));
      setEmpty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    function onChange() { load(); }
    window.addEventListener("appscout:watchlist-changed", onChange);
    return () => window.removeEventListener("appscout:watchlist-changed", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-2">★ Your watchlist</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Pinned opportunities</h1>
            <p className="text-zinc-400">
              Stored locally on this device. Add or remove items by clicking the star on any card.
            </p>
          </div>

          {loading ? (
            <p className="text-zinc-500 text-sm">Loading…</p>
          ) : empty ? (
            <div
              className="text-center py-16 rounded-xl border border-dashed border-[#1a1a26]"
            >
              <div className="text-4xl mb-3">☆</div>
              <p className="text-zinc-400 text-sm mb-1">Your watchlist is empty.</p>
              <p className="text-zinc-600 text-xs mb-4">Click the ★ on any opportunity to pin it.</p>
              <a href="/terminal" className="text-neon text-sm hover:opacity-80">Browse the terminal →</a>
            </div>
          ) : (
            <>
              <p className="text-xs text-zinc-500 mb-5 font-mono">{opps.length} pinned</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {opps.map((o) => (
                  <TerminalCard key={o.id} opportunity={o} unlocked={true} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
