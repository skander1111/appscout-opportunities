// Server-side license management.
// - One file: web/data/licenses.json
// - License = { code, tier, issuedAt, expiresAt, quotaTotal, quotaUsed, usageLog }
// - Activated via HTTP-only cookie containing the license code
// - Quota is consumed atomically per AI call (cost can be > 1 unit for heavy ops)

import fs from "fs";
import path from "path";
import crypto from "crypto";

export type LicenseTier = "report" | "monthly" | "yearly";

export interface License {
  code: string;
  tier: LicenseTier;
  issuedAt: string;
  expiresAt: string;
  quotaTotal: number;
  quotaUsed: number;
  usageLog: { at: string; op: string; cost: number }[];
  revoked?: boolean;
  email?: string;
  source?: string; // gumroad order id, manual, etc.
}

const FILE = path.join(process.cwd(), "data", "licenses.json");

// Tier definitions. These numbers are calibrated so:
//   tier net rev > tier max AI cost × 2.5
// using Haiku 4.5 at ~$0.007 avg / call.
export const TIER_CONFIG: Record<LicenseTier, { hours: number; quota: number; label: string; priceUsd: number }> = {
  report:  { hours: 24,             quota: 150,   label: "One report (24h)", priceUsd: 9   },
  monthly: { hours: 24 * 30,        quota: 600,   label: "Monthly",          priceUsd: 19  },
  yearly:  { hours: 24 * 365,       quota: 6000,  label: "Yearly",           priceUsd: 119 },
};

function load(): License[] {
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return []; }
}

function save(licenses: License[]) {
  fs.writeFileSync(FILE, JSON.stringify(licenses, null, 2));
}

export function generateCode(): string {
  // Format: AS-XXXX-XXXX-XXXX-XXXX (20 hex chars + prefix)
  const buf = crypto.randomBytes(10).toString("hex").toUpperCase();
  return `AS-${buf.slice(0, 4)}-${buf.slice(4, 8)}-${buf.slice(8, 12)}-${buf.slice(12, 16)}`;
}

export function issueLicense(tier: LicenseTier, opts: { email?: string; source?: string } = {}): License {
  const cfg = TIER_CONFIG[tier];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + cfg.hours * 3600 * 1000);
  const license: License = {
    code: generateCode(),
    tier,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    quotaTotal: cfg.quota,
    quotaUsed: 0,
    usageLog: [],
    email: opts.email,
    source: opts.source,
  };
  const all = load();
  all.push(license);
  save(all);
  return license;
}

export function findLicense(code: string): License | null {
  if (!code) return null;
  const all = load();
  return all.find((l) => l.code === code) ?? null;
}

export interface LicenseStatus {
  valid: boolean;
  tier?: LicenseTier;
  reason?: string;
  expiresAt?: string;
  quotaRemaining?: number;
  quotaTotal?: number;
  resetsAt?: string;
  hoursRemaining?: number;
}

export function getStatus(code: string | undefined): LicenseStatus {
  if (!code) return { valid: false, reason: "no license" };
  const lic = findLicense(code);
  if (!lic) return { valid: false, reason: "license not found" };
  if (lic.revoked) return { valid: false, reason: "license revoked" };

  const now = Date.now();
  const exp = new Date(lic.expiresAt).getTime();
  if (now > exp) return { valid: false, reason: "license expired", expiresAt: lic.expiresAt };

  const remaining = Math.max(0, lic.quotaTotal - lic.quotaUsed);
  return {
    valid: remaining > 0,
    tier: lic.tier,
    reason: remaining === 0 ? "quota exhausted" : undefined,
    expiresAt: lic.expiresAt,
    quotaRemaining: remaining,
    quotaTotal: lic.quotaTotal,
    resetsAt: lic.expiresAt,
    hoursRemaining: Math.max(0, Math.floor((exp - now) / 3600 / 1000)),
  };
}

export interface ConsumeResult {
  ok: boolean;
  reason?: string;
  remaining?: number;
  total?: number;
}

export function consumeQuota(code: string, op: string, cost = 1): ConsumeResult {
  const all = load();
  const idx = all.findIndex((l) => l.code === code);
  if (idx < 0) return { ok: false, reason: "license not found" };
  const lic = all[idx];

  if (lic.revoked) return { ok: false, reason: "license revoked" };
  const now = Date.now();
  if (now > new Date(lic.expiresAt).getTime()) return { ok: false, reason: "license expired" };

  if (lic.quotaUsed + cost > lic.quotaTotal) {
    return { ok: false, reason: "quota exhausted", remaining: lic.quotaTotal - lic.quotaUsed, total: lic.quotaTotal };
  }

  lic.quotaUsed += cost;
  lic.usageLog.push({ at: new Date().toISOString(), op, cost });
  if (lic.usageLog.length > 200) lic.usageLog = lic.usageLog.slice(-200);

  all[idx] = lic;
  save(all);
  return { ok: true, remaining: lic.quotaTotal - lic.quotaUsed, total: lic.quotaTotal };
}

export function revoke(code: string): boolean {
  const all = load();
  const idx = all.findIndex((l) => l.code === code);
  if (idx < 0) return false;
  all[idx].revoked = true;
  save(all);
  return true;
}

// ── HTTP helpers ────────────────────────────────────────────────────

const COOKIE = "appscout_license";

export function readLicenseCookie(req: Request): string | undefined {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === COOKIE) return decodeURIComponent(v);
  }
  return undefined;
}

export function setLicenseCookieHeader(code: string, hours: number): string {
  const maxAge = Math.floor(hours * 3600);
  return `${COOKIE}=${encodeURIComponent(code)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearLicenseCookieHeader(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// Wrap any AI route. Returns either the parsed license code or a NextResponse with 402.
export async function requireLicense(req: Request, op: string, cost = 1):
  Promise<{ ok: true; tier: LicenseTier; code: string; remaining: number }
         | { ok: false; status: number; body: { error: string; reason: string; quotaRemaining?: number; quotaTotal?: number; tier?: LicenseTier } }> {
  // Allow override via header (server-to-server) — admin token bypass.
  const adminToken = req.headers.get("x-appscout-admin");
  if (adminToken && adminToken === process.env.APPSCOUT_ADMIN_TOKEN) {
    return { ok: true, tier: "yearly", code: "admin", remaining: Infinity };
  }

  const code = readLicenseCookie(req);
  if (!code) {
    return { ok: false, status: 402, body: { error: "license required", reason: "no license activated" } };
  }
  const lic = findLicense(code);
  if (!lic) return { ok: false, status: 402, body: { error: "license invalid", reason: "license not found" } };
  if (lic.revoked) return { ok: false, status: 402, body: { error: "license revoked", reason: "license revoked", tier: lic.tier } };
  if (Date.now() > new Date(lic.expiresAt).getTime()) {
    return { ok: false, status: 402, body: { error: "license expired", reason: "license expired", tier: lic.tier } };
  }

  const remaining = lic.quotaTotal - lic.quotaUsed;
  if (remaining < cost) {
    return {
      ok: false,
      status: 402,
      body: { error: "quota exhausted", reason: "quota exhausted", tier: lic.tier, quotaRemaining: remaining, quotaTotal: lic.quotaTotal },
    };
  }

  // cost=0 → license check only, no quota mutation
  if (cost === 0) {
    return { ok: true, tier: lic.tier, code, remaining };
  }

  const consumed = consumeQuota(code, op, cost);
  if (!consumed.ok) {
    return { ok: false, status: 402, body: { error: "quota exhausted", reason: consumed.reason || "quota exhausted", tier: lic.tier } };
  }

  return { ok: true, tier: lic.tier, code, remaining: consumed.remaining ?? 0 };
}
