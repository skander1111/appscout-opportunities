"use client";

import { useEffect, useState } from "react";

type TickerApp = {
  title: string;
  opportunityScore: number;
  installs: string;
  minInstalls: number;
  daysSinceUpdate: number;
  niche: string;
  platform: string;
};

const FALLBACK: TickerApp[] = [
  { title: "Tabata Timer: Interval Timer", opportunityScore: 90, installs: "5,000,000+", minInstalls: 5000000, daysSinceUpdate: 421, niche: "Timer", platform: "android" },
  { title: "Barcode Scanner - Price Finder", opportunityScore: 90, installs: "5,000,000+", minInstalls: 5000000, daysSinceUpdate: 546, niche: "Barcode Scanner", platform: "android" },
  { title: "Simple Habit: Meditation", opportunityScore: 85, installs: "1,000,000+", minInstalls: 1000000, daysSinceUpdate: 536, niche: "Meditation", platform: "android" },
  { title: "10BA Pro Financial Calculator", opportunityScore: 90, installs: "100,000+", minInstalls: 100000, daysSinceUpdate: 3149, niche: "Calculator", platform: "android" },
  { title: "Any Ringtones", opportunityScore: 95, installs: "500,000+", minInstalls: 500000, daysSinceUpdate: 199, niche: "Ringtone", platform: "android" },
];

function actionLabel(days: number) {
  if (days >= 365) return { text: "Acquire", color: "text-emerald-400" };
  if (days >= 180) return { text: "Rebuild", color: "text-blue-400" };
  return { text: "Watch", color: "text-amber-400" };
}

export default function TickerTape() {
  const [apps, setApps] = useState<TickerApp[]>(FALLBACK);

  useEffect(() => {
    fetch("/api/opportunities?limit=20")
      .then((r) => r.json())
      .then((d) => { if (d.apps?.length) setApps(d.apps); })
      .catch(() => {});
  }, []);

  const items = [...apps, ...apps];

  return (
    <div className="relative overflow-hidden border-t border-emerald-500/10 bg-[#050508] py-2.5 mt-10">
      <div className="flex items-center gap-0 animate-ticker whitespace-nowrap">
        {items.map((app, i) => {
          const action = actionLabel(app.daysSinceUpdate);
          const installs = app.installs || `${(app.minInstalls || 0).toLocaleString()}+`;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-2.5 px-5 text-xs"
            >
              <span className="text-emerald-500/40">◆</span>
              <span className="text-gray-300 font-medium">{app.title}</span>
              <span
                className="font-bold tabular-nums"
                style={{
                  color:
                    app.opportunityScore >= 85
                      ? "#10b981"
                      : app.opportunityScore >= 70
                      ? "#3b82f6"
                      : "#f59e0b",
                }}
              >
                {app.opportunityScore}
              </span>
              <span className="text-gray-600">{installs}</span>
              <span
                className={`${
                  app.daysSinceUpdate >= 365 ? "text-red-400/60" : "text-amber-400/60"
                }`}
              >
                {app.daysSinceUpdate}d stale
              </span>
              <span className={`${action.color} text-[10px]`}>{action.text}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
