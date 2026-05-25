"use client";

import { useEffect, useState, useCallback } from "react";

export interface LicenseClientStatus {
  valid: boolean;
  tier?: "report" | "monthly" | "yearly";
  reason?: string;
  expiresAt?: string;
  quotaRemaining?: number;
  quotaTotal?: number;
  hoursRemaining?: number;
}

const EVT = "appscout:license-changed";

export function useLicense() {
  const [status, setStatus] = useState<LicenseClientStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/license/status", { cache: "no-store" });
      const data = (await res.json()) as LicenseClientStatus;
      setStatus(data);
    } catch {
      setStatus({ valid: false, reason: "network" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    function onChange() { refresh(); }
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
  }, [refresh]);

  return { status, loading, refresh };
}

export async function activateLicense(code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "activation failed" };
    window.dispatchEvent(new CustomEvent(EVT));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "network" };
  }
}

export async function signOutLicense(): Promise<void> {
  await fetch("/api/license/status", { method: "DELETE" });
  window.dispatchEvent(new CustomEvent(EVT));
}

export function tierLabel(tier?: string): string {
  if (tier === "yearly") return "Yearly";
  if (tier === "monthly") return "Monthly";
  if (tier === "report") return "Day pass";
  return "Free";
}

export function formatRemaining(s: LicenseClientStatus | null): string {
  if (!s?.valid) return "locked";
  if (s.hoursRemaining != null && s.hoursRemaining < 24) return `${s.hoursRemaining}h left · ${s.quotaRemaining}/${s.quotaTotal} AI`;
  const days = Math.floor((s.hoursRemaining ?? 0) / 24);
  return `${days}d left · ${s.quotaRemaining}/${s.quotaTotal} AI`;
}
