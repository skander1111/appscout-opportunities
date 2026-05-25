"use client";

import { useState } from "react";
import type { Opportunity } from "@/lib/opportunities";

interface Roi {
  rebuildCostUsd: { low: number; high: number };
  monthlyRevenueUsd: { low: number; mid: number; high: number };
  twelveMonthRevenueUsd: number;
  breakevenMonths: number;
  roiPctYear1: number;
  assumptions: string[];
  risks: string[];
}

const PRESETS = [500, 2000, 5000, 15000, 50000];

export default function RoiSimulator({ opportunity }: { opportunity: Opportunity }) {
  const [price, setPrice] = useState<number>(2000);
  const [loading, setLoading] = useState(false);
  const [roi, setRoi] = useState<Roi | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/roi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: opportunity.id, askingPriceUsd: price }),
      });
      const data = await res.json();
      if (res.status === 402) {
        throw new Error("🔒 Locked — activate a license to use the ROI simulator. /#pricing");
      }
      if (!res.ok) throw new Error(data.error || "ROI failed");
      setRoi(data.roi);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#070709] border border-white/5 rounded-lg p-3 space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">ROI simulator</p>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPrice(p)}
            className={`text-[10px] px-2 py-1 rounded-md border ${
              price === p ? "border-neon/40 bg-neon/10 text-neon" : "border-[#2a2a3e] text-zinc-400"
            }`}
          >
            ${p.toLocaleString()}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500">Asking price (USD)</span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 0))}
          className="bg-[#0a0a10] border border-[#1a1a26] rounded-md px-2 py-1 text-xs text-white w-28 focus:border-neon/40 focus:outline-none"
        />
        <button
          onClick={run}
          disabled={loading}
          className="text-[11px] font-semibold text-black px-3 py-1.5 rounded-md disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
        >
          {loading ? "Running…" : "Simulate"}
        </button>
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      {roi && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Monthly (mid)"   value={`$${roi.monthlyRevenueUsd.mid.toLocaleString()}`} color="#00ff88" />
            <Stat label="Year-1 total"    value={`$${roi.twelveMonthRevenueUsd.toLocaleString()}`} color="#00ff88" />
            <Stat label="Breakeven"       value={`${roi.breakevenMonths} mo`} color="#3b82f6" />
            <Stat label="ROI year 1"      value={`${roi.roiPctYear1 >= 0 ? "+" : ""}${roi.roiPctYear1}%`} color={roi.roiPctYear1 >= 0 ? "#00ff88" : "#ef4444"} />
          </div>

          <div className="text-[10px] text-zinc-500 flex gap-2">
            <span>Range:</span>
            <span>
              ${roi.monthlyRevenueUsd.low}/mo
              <span className="mx-1 text-zinc-700">·</span>
              ${roi.monthlyRevenueUsd.mid}/mo
              <span className="mx-1 text-zinc-700">·</span>
              ${roi.monthlyRevenueUsd.high}/mo
            </span>
          </div>

          <div className="text-[10px] text-zinc-500">
            <span className="text-zinc-400 font-semibold">Rebuild:</span>{" "}
            ${roi.rebuildCostUsd.low.toLocaleString()} – ${roi.rebuildCostUsd.high.toLocaleString()}
          </div>

          <details className="text-[10px] text-zinc-500">
            <summary className="cursor-pointer text-zinc-400 hover:text-white">Assumptions ({roi.assumptions.length})</summary>
            <ul className="mt-1 space-y-0.5">
              {roi.assumptions.map((a, i) => <li key={i}>· {a}</li>)}
            </ul>
          </details>
          <details className="text-[10px] text-zinc-500">
            <summary className="cursor-pointer text-zinc-400 hover:text-white">Risks ({roi.risks.length})</summary>
            <ul className="mt-1 space-y-0.5">
              {roi.risks.map((r, i) => <li key={i} className="text-orange-400/70">⚠ {r}</li>)}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0a0a10] rounded-md p-2">
      <div className="text-[9px] uppercase tracking-widest text-zinc-600">{label}</div>
      <div className="text-sm font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
