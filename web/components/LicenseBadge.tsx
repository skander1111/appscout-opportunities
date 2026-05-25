"use client";

import { useLicense, tierLabel, formatRemaining } from "@/lib/useLicense";

export default function LicenseBadge() {
  const { status, loading } = useLicense();
  if (loading) return null;

  if (!status?.valid) {
    return (
      <a
        href="/activate"
        className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-300 border border-[#1a1a26] hover:border-[#2a2a3e] rounded-md px-2 py-1 transition-colors"
      >
        🔒 locked
      </a>
    );
  }

  const lowQuota = (status.quotaRemaining ?? 0) < 10;
  const color = lowQuota ? "#facc15" : "#00ff88";

  return (
    <a
      href="/activate"
      className="hidden sm:inline-flex items-center gap-2 text-[11px] font-mono rounded-md px-2 py-1 border transition-colors"
      style={{ borderColor: `${color}40`, background: `${color}10`, color }}
      title={`${tierLabel(status.tier)} · ${formatRemaining(status)}`}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: color, opacity: 0.6, animation: "live-ping 1.4s infinite" }} />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: color }} />
      </span>
      <span className="uppercase tracking-widest">{tierLabel(status.tier)}</span>
      <span className="text-zinc-500">{status.quotaRemaining}/{status.quotaTotal}</span>
    </a>
  );
}
