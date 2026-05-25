"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

interface Review {
  appId: string;
  title: string;
  niche?: string;
  developer?: string;
  daysSinceUpdate?: number;
  installs?: string;
  url?: string;
  score: number;
  text: string;
  date: string;
}

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "today";
  if (d < 30) return `${Math.floor(d)}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function ReviewsStreamPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [niche, setNiche] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews-stream?maxScore=2&limit=120${niche ? `&niche=${encodeURIComponent(niche)}` : ""}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .finally(() => setLoading(false));
  }, [niche]);

  const niches = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach((r) => { if (r.niche) set.add(r.niche); });
    return Array.from(set).sort();
  }, [reviews]);

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-2">Reviews stream</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Where users are angry — and rebuild opportunities live</h1>
            <p className="text-zinc-400">
              Real 1- and 2-star reviews from stale apps. Every complaint is a feature in someone else&apos;s next product.
            </p>
          </div>

          {/* Niche filter */}
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">filter niche:</span>
            <button
              onClick={() => setNiche("")}
              className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${
                niche === "" ? "border-neon/40 bg-neon/10 text-neon" : "border-[#1a1a26] text-zinc-400 hover:border-[#2a2a3e]"
              }`}
            >
              all
            </button>
            {niches.slice(0, 12).map((n) => (
              <button
                key={n}
                onClick={() => setNiche(n)}
                className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${
                  niche === n ? "border-neon/40 bg-neon/10 text-neon" : "border-[#1a1a26] text-zinc-400 hover:border-[#2a2a3e]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-zinc-500 text-sm">Loading…</p>
          ) : reviews.length === 0 ? (
            <p className="text-zinc-500 text-sm">No reviews available for this filter.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div
                  key={`${r.appId}-${i}`}
                  className="bg-[#0a0a10] border border-[#1a1a26] rounded-xl p-4 hover:border-[#2a2a3e] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${r.score === 1 ? "text-red-400" : "text-orange-400"}`}>
                          {"★".repeat(r.score)}{"☆".repeat(5 - r.score)}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono">{timeAgo(r.date)}</span>
                        {r.niche && (
                          <span className="text-[9px] uppercase tracking-widest text-zinc-500 bg-white/[0.03] px-1.5 py-0.5 rounded">
                            {r.niche}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate">{r.title}</h3>
                      <p className="text-[10px] text-zinc-600">
                        {r.developer} · {r.installs} · stale {r.daysSinceUpdate}d
                      </p>
                    </div>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-400 hover:text-blue-300 shrink-0"
                      >
                        view app →
                      </a>
                    )}
                  </div>
                  <blockquote className="text-sm text-zinc-300 leading-relaxed border-l-2 pl-3 italic" style={{ borderColor: r.score === 1 ? "#ef4444" : "#f59e0b" }}>
                    “{r.text}”
                  </blockquote>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
