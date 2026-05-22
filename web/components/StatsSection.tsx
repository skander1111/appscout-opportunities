"use client";
import { useEffect, useRef, useState } from "react";

function useCountUp(end: number, duration = 1800) {
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
      { threshold: 0.4 }
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, end, duration]);

  return { count, ref };
}

function StatItem({ value, suffix = "", label }: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const { count, ref } = useCountUp(value);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-2 py-6 px-4 bg-white/[0.02] border border-white/5 rounded-2xl"
    >
      <div
        className="text-3xl sm:text-4xl font-bold text-emerald-400 tabular-nums"
        style={{ textShadow: "0 0 24px rgba(52,211,153,0.25)" }}
      >
        {count}{suffix}
      </div>
      <div className="text-xs text-zinc-500 text-center leading-snug">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="py-12 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatItem value={247} suffix=""   label="apps scanned this week" />
          <StatItem value={54}  suffix=""   label="qualified opportunities live" />
          <StatItem value={100} suffix="%"  label="developer contact found" />
          <StatItem value={19}  suffix="+"  label="niches tracked" />
        </div>
      </div>
    </section>
  );
}
