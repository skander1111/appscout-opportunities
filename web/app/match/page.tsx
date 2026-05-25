"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TerminalCard from "@/components/TerminalCard";
import type { Opportunity } from "@/lib/opportunities";
import type { UserProfile, MatchResult } from "@/lib/ai";

const GOALS = [
  { id: "buy",     label: "Buy an asset" },
  { id: "build",   label: "Build / rebuild" },
  { id: "partner", label: "Partner / co-found" },
  { id: "invest",  label: "Invest" },
  { id: "sell",    label: "Sell mine" },
] as const;

const BUDGETS = [
  { id: "<1k",     label: "< $1k" },
  { id: "1k-5k",   label: "$1k – $5k" },
  { id: "5k-25k",  label: "$5k – $25k" },
  { id: "25k+",    label: "$25k+" },
];

const TECH = [
  { id: "non-technical", label: "Non-technical" },
  { id: "junior",        label: "Junior dev" },
  { id: "experienced",   label: "Experienced dev" },
  { id: "expert",        label: "Senior / specialist" },
] as const;

const SKILL_OPTIONS = ["react", "next.js", "ios", "android", "ai/ml", "design", "marketing", "sales", "ops", "growth"];

const NICHE_OPTIONS = ["Productivity", "Fitness", "Habit Tracker", "Meditation", "PDF Tools", "Calculator", "Wallpaper", "Ringtone", "Barcode Scanner", "AI", "SaaS"];

type Result = MatchResult & { opportunity: Opportunity };

export default function MatchPage() {
  const [profile, setProfile] = useState<UserProfile>({
    goal: "buy",
    budget: "1k-5k",
    skills: [],
    niches: [],
    technicalLevel: "experienced",
  });
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (res.status === 402) {
        throw new Error("Profile matching is locked. Activate a license to use it.");
      }
      if (!res.ok) throw new Error(data.error || "match failed");
      setResults((data.matches || []).filter((m: Result) => m.opportunity));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Profile match</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">AI picks the opportunities that fit you</h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Tell us your goal, budget, and skills. Claude ranks every live opportunity for fit and explains why.
              Free for everyone — full results visible to Yearly members.
            </p>
          </div>

          <form onSubmit={run} className="space-y-6 bg-[#0a0a10] border border-[#1a1a26] rounded-2xl p-6 mb-10">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3 block">Goal</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setProfile((p) => ({ ...p, goal: g.id }))}
                    className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                      profile.goal === g.id ? "border-neon/40 bg-neon/10 text-neon" : "border-[#1a1a26] bg-[#070709] text-zinc-400 hover:border-[#2a2a3e]"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3 block">Budget</label>
                <div className="flex flex-wrap gap-1.5">
                  {BUDGETS.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => setProfile((p) => ({ ...p, budget: b.id }))}
                      className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                        profile.budget === b.id ? "border-neon/40 bg-neon/10 text-neon" : "border-[#1a1a26] bg-[#070709] text-zinc-400 hover:border-[#2a2a3e]"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3 block">Technical level</label>
                <div className="flex flex-wrap gap-1.5">
                  {TECH.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setProfile((p) => ({ ...p, technicalLevel: t.id }))}
                      className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                        profile.technicalLevel === t.id ? "border-neon/40 bg-neon/10 text-neon" : "border-[#1a1a26] bg-[#070709] text-zinc-400 hover:border-[#2a2a3e]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3 block">Skills (pick any)</label>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_OPTIONS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setProfile((p) => ({ ...p, skills: toggle(p.skills, s) }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      profile.skills.includes(s) ? "border-neon/40 bg-neon/10 text-neon" : "border-[#1a1a26] bg-[#070709] text-zinc-400 hover:border-[#2a2a3e]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3 block">Preferred niches</label>
              <div className="flex flex-wrap gap-1.5">
                {NICHE_OPTIONS.map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setProfile((p) => ({ ...p, niches: toggle(p.niches, n) }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      profile.niches.includes(n) ? "border-neon/40 bg-neon/10 text-neon" : "border-[#1a1a26] bg-[#070709] text-zinc-400 hover:border-[#2a2a3e]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold px-7 py-3.5 rounded-xl text-sm text-black disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)", boxShadow: "0 0 25px rgba(0,255,136,0.4)" }}
            >
              {loading ? "Matching…" : "Match opportunities to me →"}
            </button>
          </form>

          {done && results.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No strong matches. Loosen the niches and try again.
            </div>
          )}

          {results.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Top {results.length} matches</h2>
              <p className="text-xs text-zinc-500 mb-6 font-mono">ranked by AI fit-score for your profile</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((r) => (
                  <div key={r.opportunityId} className="relative">
                    <div
                      className="absolute -top-2 -left-2 z-10 text-[10px] font-bold text-black px-2 py-0.5 rounded-md font-mono"
                      style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
                    >
                      {r.fitScore} fit
                    </div>
                    <TerminalCard opportunity={r.opportunity} unlocked={false} />
                    <p className="mt-2 text-[10px] text-zinc-500 italic px-2 leading-relaxed">↳ {r.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
