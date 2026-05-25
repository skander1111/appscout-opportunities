"use client";

import { useEffect, useState } from "react";
import { getWatchlist } from "@/lib/watchlist";
import LicenseBadge from "./LicenseBadge";

export default function Nav() {
  const [watchCount, setWatchCount] = useState(0);

  useEffect(() => {
    setWatchCount(getWatchlist().length);
    const onChange = () => setWatchCount(getWatchlist().length);
    window.addEventListener("appscout:watchlist-changed", onChange);
    return () => window.removeEventListener("appscout:watchlist-changed", onChange);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050508]/90 backdrop-blur-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <a href="/" className="text-lg font-bold tracking-tight flex-shrink-0">
          App<span className="text-neon">Scout</span>
          <span className="ml-2 text-[10px] uppercase tracking-widest text-zinc-600 hidden sm:inline">Terminal</span>
        </a>

        <div className="flex items-center gap-3 lg:gap-5 min-w-0">
          <a href="/terminal" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block whitespace-nowrap">Terminal</a>
          <a href="/pulse"    className="text-sm text-zinc-400 hover:text-white transition-colors hidden md:block whitespace-nowrap">Pulse</a>
          <a href="/search"   className="text-sm text-zinc-400 hover:text-white transition-colors hidden md:block whitespace-nowrap">AI search</a>
          <a href="/lookup"   className="text-sm text-zinc-400 hover:text-white transition-colors hidden lg:block whitespace-nowrap">Lookup</a>
          <a href="/today"    className="text-sm text-zinc-400 hover:text-white transition-colors hidden lg:block whitespace-nowrap">Today</a>
          <a href="/niches"   className="text-sm text-zinc-400 hover:text-white transition-colors hidden lg:block whitespace-nowrap">Niches</a>
          <a href="/watchlist" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:flex items-center gap-1 whitespace-nowrap">
            <span style={{ color: watchCount > 0 ? "#facc15" : "#71717a" }}>★</span>
            {watchCount > 0 && <span className="text-[10px] text-yellow-400 font-mono">{watchCount}</span>}
          </a>
          <LicenseBadge />
          <a
            href="/#pricing"
            className="text-sm text-black font-semibold px-3 py-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
              boxShadow: "0 0 18px rgba(0,255,136,0.35)",
            }}
          >
            Get access
          </a>
        </div>
      </div>
    </nav>
  );
}
