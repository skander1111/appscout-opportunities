"use client";

import { useEffect, useState } from "react";

const SEED = 847;
const LAUNCH = new Date("2026-05-22T10:00:00Z").getTime();

function liveCount(): number {
  const hoursLive = (Date.now() - LAUNCH) / (1000 * 60 * 60);
  return SEED + Math.floor((hoursLive * 14) / 24);
}

function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (display === target) return;
    const start = display;
    const diff = target - start;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <>{display.toLocaleString()}</>;
}

export default function VisitorCounter() {
  const [count, setCount] = useState<number>(liveCount);

  useEffect(() => {
    const key = "appscout_visited";
    const method = localStorage.getItem(key) ? "GET" : "POST";

    fetch("/api/counter", { method })
      .then((r) => r.json())
      .then((d) => {
        if (d.count) setCount(d.count);
        if (method === "POST") localStorage.setItem(key, "1");
      })
      .catch(() => {});
  }, []);

  return <AnimatedNumber target={count} />;
}
