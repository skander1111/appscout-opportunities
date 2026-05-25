"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TerminalCard from "@/components/TerminalCard";
import type { Opportunity } from "@/lib/opportunities";

interface Match {
  opportunityId: string;
  relevance: number;
  reason: string;
  opportunity: Opportunity;
}

const EXAMPLES = [
  "wallpaper apps under $2k with reachable owners",
  "abandoned calculator apps with over 100k installs",
  "github projects in fitness with 1k+ stars",
  "rebuild opportunities in PDF tools",
  "non-technical buyer, budget under $5k",
];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Match[]>([]);
  const [filter, setFilter] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (res.status === 402) {
        throw new Error("AI search is locked. Activate a license to use it.");
      }
      if (!res.ok) throw new Error(data.error || "search failed");
      setResults(data.matches || []);
      setFilter(data.filter || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">AI search</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Find opportunities in plain English</h1>
            <p className="text-zinc-400">
              Describe what you want. Claude parses your query, applies filters, and ranks every live opportunity.
            </p>
          </div>

          <form onSubmit={run} className="mb-6">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. wallpaper apps under $2k with reachable owners"
                className="flex-1 bg-[#0a0a10] border border-[#1a1a26] rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !q.trim()}
                className="font-bold px-6 py-3.5 rounded-xl text-sm text-black disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
              >
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => { setQ(ex); setTimeout(() => run(), 0); }}
                  className="text-[11px] text-zinc-500 px-3 py-1 rounded-full border border-[#1a1a26] hover:border-neon/30 hover:text-zinc-300 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </form>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 mb-6">{error}</div>
          )}

          {Object.keys(filter).length > 0 && (
            <div className="mb-6 p-3 bg-[#0a0a10] border border-[#1a1a26] rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Parsed filter</p>
              <pre className="text-[11px] text-zinc-400 overflow-x-auto">{JSON.stringify(filter, null, 2)}</pre>
            </div>
          )}

          {results.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-1">Top {results.length} results</h2>
              <p className="text-xs text-zinc-500 mb-5 font-mono">ranked by AI relevance to your query</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((m) => (
                  <div key={m.opportunityId} className="relative">
                    <div
                      className="absolute -top-2 -left-2 z-10 text-[10px] font-bold text-black px-2 py-0.5 rounded-md font-mono"
                      style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
                    >
                      {m.relevance}%
                    </div>
                    <TerminalCard opportunity={m.opportunity} unlocked={false} />
                    <p className="mt-2 text-[10px] text-zinc-500 italic px-2 leading-relaxed">↳ {m.reason}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && results.length === 0 && !error && q && (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No matches. Try a broader query or remove a constraint.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
