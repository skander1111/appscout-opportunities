"use client";

import { useEffect, useState } from "react";
import type { Opportunity, AiPrediction } from "@/lib/opportunities";
import { blurContact } from "@/lib/opportunities";
import { isWatched, toggleWatch } from "@/lib/watchlist";
import RoiSimulator from "./RoiSimulator";
import OpportunityNotes from "./OpportunityNotes";

const ACTION_COLOR: Record<string, string> = {
  acquire: "#00ff88",
  rebuild: "#3b82f6",
  partner: "#a855f7",
  buy:     "#facc15",
  sell:    "#fb923c",
  invest:  "#22d3ee",
  watch:   "#71717a",
  ignore:  "#52525b",
};

const SOURCE_LABEL: Record<string, string> = {
  googleplay:   "Google Play",
  appstore:     "App Store",
  github:       "GitHub",
  reddit:       "Reddit",
  hackernews:   "Hacker News",
  producthunt:  "Product Hunt",
  submission:   "Marketplace",
};

const KIND_BADGE: Record<string, { label: string; color: string }> = {
  "abandoned-app":   { label: "abandoned app", color: "#00ff88" },
  "rebuild-target":  { label: "rebuild",       color: "#3b82f6" },
  "github-stale":    { label: "github stale",  color: "#22d3ee" },
  "seller-lead":     { label: "seller lead",   color: "#facc15" },
  "startup-signal":  { label: "signal",        color: "#a855f7" },
  "partner-request": { label: "partner req.",  color: "#fb923c" },
  "user-submission": { label: "submission",    color: "#ec4899" },
};

interface Props {
  opportunity: Opportunity;
  unlocked: boolean;
}

function formatMeta(o: Opportunity): string {
  const bits: string[] = [];
  if (o.installs) bits.push(`${o.installs.toLocaleString()}+ installs`);
  if (o.stars) bits.push(`${o.stars.toLocaleString()}★`);
  if (o.daysStale != null) bits.push(`${o.daysStale}d stale`);
  if (o.rating) bits.push(`★${o.rating.toFixed(1)}`);
  return bits.join(" · ");
}

function ScoreBar({ label, value, color, locked }: { label: string; value: number; color: string; locked?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#0d0d14] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: color,
            boxShadow: `0 0 8px ${color}55`,
            filter: locked ? "blur(2.5px)" : undefined,
          }}
        />
      </div>
      <span
        className={`text-[10px] font-bold tabular-nums w-6 text-right ${locked ? "blur-[3px] select-none" : ""}`}
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

export default function TerminalCard({ opportunity: o, unlocked }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [ai, setAi] = useState<AiPrediction | undefined>(o.ai);
  const [watched, setWatched] = useState(false);
  const [showRoi, setShowRoi] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [aiLocked, setAiLocked] = useState(false);

  useEffect(() => {
    setWatched(isWatched(o.id));
    function onChange() { setWatched(isWatched(o.id)); }
    window.addEventListener("appscout:watchlist-changed", onChange);
    return () => window.removeEventListener("appscout:watchlist-changed", onChange);
  }, [o.id]);

  const action = ai?.recommendedAction || "watch";
  const actionColor = ACTION_COLOR[action] || "#71717a";
  const kindBadge = KIND_BADGE[o.kind] || { label: o.kind, color: "#71717a" };
  const score = ai?.opportunityScore ?? o.legacyScore ?? 65;
  const contact = unlocked ? o.contact : o.contact ? blurContact(o.contact) : undefined;

  async function loadAi() {
    if (ai || loadingAi) return;
    setLoadingAi(true);
    try {
      const res = await fetch(`/api/ai/predict?id=${encodeURIComponent(o.id)}`);
      if (res.status === 402) {
        setAiLocked(true);
        return;
      }
      const data = await res.json();
      if (data.prediction) setAi(data.prediction);
    } catch {} finally {
      setLoadingAi(false);
    }
  }

  function handleStarClick(e: React.MouseEvent) {
    e.stopPropagation();
    setWatched(toggleWatch(o.id));
  }

  return (
    <div
      className="bg-[#0a0a10] border border-[#1a1a26] rounded-xl p-4 hover:border-[#2a2a3e] transition-all cursor-pointer"
      onClick={() => {
        setExpanded((v) => !v);
        if (!ai) loadAi();
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-mono"
              style={{ background: `${kindBadge.color}15`, color: kindBadge.color }}
            >
              {kindBadge.label}
            </span>
            <span className="text-[10px] text-zinc-600 font-mono">{SOURCE_LABEL[o.source] || o.source}</span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug truncate">{o.title}</h3>
          {o.niche && <p className="text-[10px] text-zinc-600 mt-0.5">{o.niche}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleStarClick}
              className="text-base hover:scale-110 transition-transform"
              title={watched ? "Remove from watchlist" : "Add to watchlist"}
            >
              <span style={{ color: watched ? "#facc15" : "#3f3f46" }}>{watched ? "★" : "☆"}</span>
            </button>
            <div
              className="text-lg font-bold tabular-nums"
              style={{ color: score >= 80 ? "#00ff88" : score >= 60 ? "#3b82f6" : "#94a3b8" }}
            >
              {score}
            </div>
          </div>
          <span
            className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border"
            style={{ color: actionColor, borderColor: `${actionColor}40`, background: `${actionColor}10` }}
          >
            {action}
          </span>
        </div>
      </div>

      {/* Meta */}
      {formatMeta(o) && <p className="text-[11px] text-zinc-500 mb-2">{formatMeta(o)}</p>}

      {/* Description (preview) */}
      {o.description && !expanded && (
        <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2">{o.description}</p>
      )}

      {/* AI block when expanded */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-3" onClick={(e) => e.stopPropagation()}>
          {loadingAi && (
            <p className="text-[11px] text-zinc-500">Generating AI prediction…</p>
          )}

          {aiLocked && !ai && (
            <div
              className="rounded-lg p-4 text-center"
              style={{
                background: "linear-gradient(160deg, rgba(0,255,136,0.06), transparent)",
                border: "1px solid rgba(0,255,136,0.25)",
              }}
            >
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-xs text-zinc-300 mb-1 font-semibold">AI prediction locked</p>
              <p className="text-[11px] text-zinc-500 mb-3">
                Activate a license to unlock all AI features. $9 = 24h · $19 = 30d · $119 = 1yr.
              </p>
              <div className="flex justify-center gap-2">
                <a
                  href="/#pricing"
                  className="text-[11px] font-bold text-black px-3 py-1.5 rounded-md"
                  style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
                >
                  See plans →
                </a>
                <a
                  href="/activate"
                  className="text-[11px] font-semibold text-neon border border-neon/40 px-3 py-1.5 rounded-md"
                >
                  Activate code
                </a>
              </div>
            </div>
          )}

          {ai && (
            <>
              <div className="space-y-1.5">
                <ScoreBar label="Opportunity" value={ai.opportunityScore} color="#00ff88" />
                <ScoreBar label="Demand"      value={ai.demandScore} color="#00ff88" />
                <ScoreBar label="Money"       value={ai.moneyPotential} color="#3b82f6" />
                <ScoreBar label="Build diff." value={ai.buildDifficulty} color="#a855f7" />
                <ScoreBar label="Acquire diff." value={ai.acquisitionDifficulty} color="#facc15" locked={!unlocked} />
                <ScoreBar label="Legal risk"  value={ai.legalRisk} color="#fb923c" locked={!unlocked} />
                <ScoreBar label="Competition" value={ai.competitionRisk} color="#fb923c" locked={!unlocked} />
              </div>

              <div className="bg-[#070709] rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Why now</p>
                <p className="text-xs text-zinc-300 leading-relaxed">{ai.whyNow}</p>
              </div>

              {unlocked ? (
                <>
                  <div className="bg-[#070709] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Monetization ideas</p>
                    <ul className="space-y-1">
                      {ai.monetizationIdeas.slice(0, 4).map((m, i) => (
                        <li key={i} className="text-[11px] text-zinc-300 flex gap-1.5">
                          <span className="text-neon shrink-0">▸</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#070709] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Outreach draft</p>
                    <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{ai.outreachDraft}</pre>
                    <button
                      className="mt-2 text-[10px] text-neon hover:opacity-80"
                      onClick={() => navigator.clipboard.writeText(ai.outreachDraft)}
                    >
                      Copy draft
                    </button>
                  </div>

                  {ai.dueDiligence?.length > 0 && (
                    <div className="bg-[#070709] rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Due diligence</p>
                      <ul className="space-y-1">
                        {ai.dueDiligence.map((d, i) => (
                          <li key={i} className="text-[11px] text-zinc-400 flex gap-1.5">
                            <span className="text-zinc-600 shrink-0">☐</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-[#070709] border border-white/5 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-zinc-400 mb-2">
                    🔒 Outreach draft · monetization · due diligence · advanced risks
                  </p>
                  <a
                    href="/#pricing"
                    className="inline-block text-[11px] text-black font-bold px-3 py-1.5 rounded-md"
                    style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
                  >
                    Unlock from $9
                  </a>
                </div>
              )}

              {/* tool row */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => setShowRoi((v) => !v)}
                  className="text-[10px] px-2 py-1 rounded-md border border-[#2a2a3e] bg-[#0a0a10] text-zinc-300 hover:border-neon/30 transition-colors"
                >
                  💵 ROI simulator
                </button>
                <a
                  href={`/today?id=${encodeURIComponent(o.id)}`}
                  className="text-[10px] px-2 py-1 rounded-md border border-[#2a2a3e] bg-[#0a0a10] text-zinc-300 hover:border-neon/30 transition-colors"
                >
                  📰 Deep dive
                </a>
                <button
                  onClick={() => setShowNotes((v) => !v)}
                  className="text-[10px] px-2 py-1 rounded-md border border-[#2a2a3e] bg-[#0a0a10] text-zinc-300 hover:border-neon/30 transition-colors"
                >
                  💬 Operator notes
                </button>
              </div>

              {showRoi && <RoiSimulator opportunity={o} />}
              {showNotes && <OpportunityNotes opportunityId={o.id} />}
            </>
          )}
        </div>
      )}

      {/* Footer row */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
        {contact ? (
          <span className="text-[10px] font-mono text-zinc-500 truncate flex-1">
            {unlocked ? <span className="text-neon">●</span> : <span className="text-zinc-600">●</span>} {contact}
          </span>
        ) : (
          <span className="text-[10px] text-zinc-700">no contact</span>
        )}
        {o.url && (
          <a
            href={o.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-400 hover:text-blue-300 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            view →
          </a>
        )}
      </div>
    </div>
  );
}
