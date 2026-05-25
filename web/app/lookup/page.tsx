"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TerminalCard from "@/components/TerminalCard";
import type { Opportunity } from "@/lib/opportunities";

const EXAMPLES = [
  "https://play.google.com/store/apps/details?id=com.b_lam.resplash",
  "https://github.com/sindresorhus/awesome",
  "https://apps.apple.com/us/app/notion/id1232780281",
];

export default function LookupPage() {
  const [url, setUrl] = useState("");
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [matched, setMatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setOpp(null);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.status === 402) {
        throw new Error("Reverse lookup is locked for new URLs. Activate a license.");
      }
      if (!res.ok) throw new Error(data.error || "lookup failed");
      setOpp(data.opportunity);
      setMatched(data.matched);
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
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Reverse lookup</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Paste any URL · get AppScout intel</h1>
            <p className="text-zinc-400">
              Play Store · App Store · GitHub · Reddit. We&apos;ll match it against our engine or generate fresh AI analysis.
            </p>
          </div>

          <form onSubmit={run} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=…"
                className="flex-1 bg-[#0a0a10] border border-[#1a1a26] rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="font-bold px-6 py-3.5 rounded-xl text-sm text-black disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
              >
                {loading ? "Analyzing…" : "Lookup"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => { setUrl(ex); setTimeout(() => run(), 0); }}
                  className="text-[10px] text-zinc-500 px-3 py-1 rounded-full border border-[#1a1a26] hover:border-neon/30 hover:text-zinc-300 transition-colors truncate max-w-full font-mono"
                >
                  {ex}
                </button>
              ))}
            </div>
          </form>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 mb-6">{error}</div>
          )}

          {opp && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                {matched ? (
                  <span className="text-[10px] text-neon font-mono uppercase tracking-widest">
                    ● matched in engine
                  </span>
                ) : (
                  <span className="text-[10px] text-yellow-400 font-mono uppercase tracking-widest">
                    ● fresh analysis — not in engine yet
                  </span>
                )}
              </div>
              <TerminalCard opportunity={opp} unlocked={true} />
            </div>
          )}

          {!loading && !opp && !error && (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">
              Supports: play.google.com · apps.apple.com · github.com · reddit.com
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
