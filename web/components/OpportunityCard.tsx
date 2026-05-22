"use client";

import { useState } from "react";

interface App {
  title: string;
  appId: string;
  url: string;
  developer: string;
  developerEmail?: string;
  installs: string;
  minInstalls: number;
  score: number;
  daysSinceUpdate: number;
  opportunityScore: number;
  ownerType: string;
  niche: string;
  platform: string;
  mainComplaints?: string[];
  classification: string;
}

function ringColor(score: number) {
  if (score >= 85) return "#10b981";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#6b7280";
}

function ScoreRing({ score }: { score: number }) {
  const color = ringColor(score);
  const capped = Math.max(0, Math.min(100, score));
  const dash = (capped / 100) * 87.96;
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#1f2937" strokeWidth="3.5" />
        <circle
          cx="18" cy="18" r="14"
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={`${dash} 87.96`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

function CopyBtn({
  text,
  label,
  doneLabel = "✓",
  className = "",
}: {
  text: string;
  label: string;
  doneLabel?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  function copy(e: React.MouseEvent) {
    e.preventDefault();
    navigator.clipboard.writeText(text).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className={`text-xs px-2 py-1 rounded transition-all ${
        done
          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
          : "text-gray-500 hover:text-gray-200 bg-[#0d0d14] border border-transparent hover:border-[#2e2e4e]"
      } ${className}`}
    >
      {done ? doneLabel : label}
    </button>
  );
}

function buildOutreach(app: App): string {
  const platform = app.platform === "ios" ? "App Store" : "Google Play";
  const installs = app.installs || `${(app.minInstalls || 0).toLocaleString()}+`;
  const verb = app.daysSinceUpdate >= 365 ? "acquire" : "rebuild or partner on";
  return `Subject: Quick question about ${app.title}

Hi,

I came across ${app.title} on ${platform} — ${installs} installs in the ${app.niche} space.

I noticed the last update was ${app.daysSinceUpdate} days ago and wasn't sure if you're still actively working on it.

I'm exploring apps I might ${verb} and yours caught my attention. Would you be open to a quick conversation about its future?

No pressure at all.

Best,`;
}

function actionBadge(app: App) {
  if (app.daysSinceUpdate >= 365)
    return { label: "Acquire", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  if (app.daysSinceUpdate >= 180)
    return { label: "Rebuild", cls: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
  return { label: "Watch", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
}

export default function OpportunityCard({ app }: { app: App }) {
  const action = actionBadge(app);
  const outreach = buildOutreach(app);
  const storeUrl =
    app.url ||
    (app.platform === "ios"
      ? `https://apps.apple.com/us/app/id${app.appId}`
      : `https://play.google.com/store/apps/details?id=${app.appId}`);

  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#2a2a3e] transition-all group flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs">{app.platform === "ios" ? "🍎" : "🤖"}</span>
            <span className="text-[11px] text-gray-600 truncate">{app.niche}</span>
          </div>
          <h3 className="text-sm font-semibold text-white truncate leading-snug group-hover:text-blue-300 transition-colors">
            {app.title}
          </h3>
          <p className="text-[11px] text-gray-600 truncate">{app.developer}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <ScoreRing score={app.opportunityScore} />
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${action.cls}`}>
            {action.label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-[#0d0d14] rounded-lg p-2 text-center">
          <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-wide">Installs</div>
          <div className="text-xs font-semibold text-white">
            {app.installs || `${(app.minInstalls || 0).toLocaleString()}+`}
          </div>
        </div>
        <div className="bg-[#0d0d14] rounded-lg p-2 text-center">
          <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-wide">Rating</div>
          <div className="text-xs font-semibold text-white">★ {Number(app.score).toFixed(1)}</div>
        </div>
        <div className="bg-[#0d0d14] rounded-lg p-2 text-center">
          <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-wide">Stale</div>
          <div
            className={`text-xs font-semibold ${
              app.daysSinceUpdate >= 365
                ? "text-red-400"
                : app.daysSinceUpdate >= 180
                ? "text-amber-400"
                : "text-gray-400"
            }`}
          >
            {app.daysSinceUpdate}d
          </div>
        </div>
      </div>

      {/* Developer email */}
      {app.developerEmail && (
        <div className="flex items-center gap-2 bg-[#0d0d14] rounded-lg px-3 py-2">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
          <span className="text-xs text-emerald-400/90 font-mono truncate flex-1">
            {app.developerEmail}
          </span>
          <CopyBtn text={app.developerEmail} label="Copy" doneLabel="✓" />
        </div>
      )}

      {/* Complaints */}
      {app.mainComplaints && app.mainComplaints.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {app.mainComplaints.slice(0, 3).map((c) => (
            <span
              key={c}
              className="text-[10px] text-red-400/70 bg-red-500/10 px-1.5 py-0.5 rounded"
            >
              ⚠ {c}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1a1a28]">
        <CopyBtn
          text={outreach}
          label="📧 Copy outreach"
          doneLabel="✓ Copied!"
          className="flex-1 text-center"
        />
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0"
        >
          View →
        </a>
      </div>
    </div>
  );
}
