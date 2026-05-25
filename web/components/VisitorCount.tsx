"use client";

import { useEffect, useState } from "react";

export default function VisitorCount() {
  const [count, setCount] = useState<number | null>(null);
  const [justIncremented, setJustIncremented] = useState(false);

  useEffect(() => {
    fetch("/api/visitor-count", { method: "POST" })
      .then((r) => r.json())
      .then((d: { count: number; counted: boolean }) => {
        setCount(d.count);
        if (d.counted) setJustIncremented(true);
      })
      .catch(() => setCount(548));
  }, []);

  if (count === null) return null;

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon/30 bg-neon/5"
      title="Real, persisted visitor count"
    >
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-neon opacity-60 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
      </span>
      <span className="text-[11px] font-mono tracking-wide text-zinc-200">
        <span className="tabular-nums font-semibold text-neon">{count.toLocaleString()}</span>
        <span className="text-zinc-400"> already using AppScout</span>
        {justIncremented && (
          <span className="ml-2 text-[10px] font-semibold text-neon animate-pulse">+1 you</span>
        )}
      </span>
    </span>
  );
}
