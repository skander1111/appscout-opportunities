"use client";

// Tiny client-side watchlist. localStorage only — no auth required.

const KEY = "appscout.watchlist";

export function getWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isWatched(id: string): boolean {
  return getWatchlist().includes(id);
}

export function toggleWatch(id: string): boolean {
  const list = getWatchlist();
  const idx = list.indexOf(id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("appscout:watchlist-changed"));
  } catch {}
  return list.includes(id);
}

export function watchlistSize(): number {
  return getWatchlist().length;
}
