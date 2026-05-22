"use client";

import { useEffect, useState } from "react";

function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (display === target) return;
    const start = display;
    const diff = target - start;
    const duration = 1200;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
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
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const key = "appscout_visited";
    const already = localStorage.getItem(key);

    if (already) {
      fetch("/api/counter")
        .then((r) => r.json())
        .then((d) => setCount(d.count))
        .catch(() => {});
    } else {
      fetch("/api/counter", { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          setCount(d.count);
          localStorage.setItem(key, "1");
        })
        .catch(() => {});
    }
  }, []);

  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <AnimatedNumber target={count} />
      <span>+ founders already exploring</span>
    </span>
  );
}
