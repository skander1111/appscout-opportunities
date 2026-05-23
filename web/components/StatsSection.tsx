"use client";
import { useEffect, useRef, useState } from "react";

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * end));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, end, duration]);

  return { count, ref };
}

function StatCard({
  value,
  suffix = "",
  label,
  sublabel,
  highlight,
}: {
  value: number;
  suffix?: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  const { count, ref } = useCountUp(value);

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center gap-3 py-8 px-6 rounded-2xl overflow-hidden"
      style={{
        background: highlight
          ? "linear-gradient(160deg, rgba(0,255,136,0.07) 0%, rgba(0,255,136,0.02) 100%)"
          : "rgba(255,255,255,0.02)",
        border: highlight
          ? "1px solid rgba(0,255,136,0.22)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: highlight
          ? "0 0 40px rgba(0,255,136,0.08), inset 0 1px 0 rgba(0,255,136,0.1)"
          : undefined,
      }}
    >
      {highlight && (
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.5), transparent)" }}
        />
      )}
      <div
        className="text-5xl sm:text-6xl font-bold tabular-nums tracking-tight"
        style={{
          color: highlight ? "#00ff88" : "#e5e7eb",
          textShadow: highlight
            ? "0 0 40px rgba(0,255,136,0.5), 0 0 80px rgba(0,255,136,0.2)"
            : "0 0 20px rgba(255,255,255,0.05)",
        }}
      >
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm font-semibold text-white/70 text-center tracking-wide">{label}</div>
      {sublabel && (
        <div className="text-xs text-zinc-600 text-center">{sublabel}</div>
      )}
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="py-16 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-semibold text-neon/60 uppercase tracking-widest mb-10">
          Live intelligence — updated weekly
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard value={247} label="Apps scanned" sublabel="this week" highlight />
          <StatCard value={54}  label="Qualified targets" sublabel="live right now" highlight />
          <StatCard value={100} suffix="%" label="Developer contact" sublabel="found per report" />
          <StatCard value={19}  suffix="+" label="Niches tracked" sublabel="across iOS & Android" />
        </div>

        <div className="mt-10 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/5" />
          <div
            className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full"
            style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.14)", color: "#00ff88" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neon" />
            </span>
            Engine running
          </div>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      </div>
    </section>
  );
}
