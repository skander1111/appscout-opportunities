// Hard monthly Anthropic budget guard. Tracks spend in Firestore under
// /site/budget so even a runaway loop / bug / abuse can't cost more than
// the configured ceiling.
//
// Env:
//   FIREBASE_PROJECT_ID — required for persistence. If unset, budget logic
//     degrades to "always allow" in dev (no remote tracking).
//   AI_MONTHLY_BUDGET_CENTS — hard cap (default 400 = €4 / month, leaves
//     headroom under a €5 owner budget).

const PROJECT = process.env.FIREBASE_PROJECT_ID;
const LIMIT_CENTS = parseInt(process.env.AI_MONTHLY_BUDGET_CENTS || "400", 10);

const DOC_PATH = (month: string) =>
  PROJECT
    ? `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/site/budget-${month}`
    : "";

function monthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Haiku 4.5 pricing (USD per million tokens): ~$1 input, ~$5 output.
// We use cents and round up to avoid undercounting.
export function estimateCostCents(inputTokens: number, outputTokens: number): number {
  const usd = (inputTokens / 1_000_000) * 1 + (outputTokens / 1_000_000) * 5;
  return Math.ceil(usd * 100);
}

async function readSpent(): Promise<number> {
  const url = DOC_PATH(monthKey());
  if (!url) return 0;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 404) return 0;
    if (!res.ok) return 0;
    const data = await res.json();
    const v = data.fields?.costCents?.integerValue ?? data.fields?.costCents?.doubleValue;
    return v != null ? Number(v) : 0;
  } catch {
    return 0;
  }
}

async function writeSpent(value: number): Promise<void> {
  const url = DOC_PATH(monthKey());
  if (!url) return;
  try {
    await fetch(`${url}?updateMask.fieldPaths=costCents`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { costCents: { integerValue: String(value) } } }),
    });
  } catch {
    // Best-effort. If write fails the next read may underestimate; budget is a
    // ceiling not a contract.
  }
}

export interface BudgetStatus {
  ok: boolean;
  spentCents: number;
  limitCents: number;
  remainingCents: number;
}

export async function checkBudget(): Promise<BudgetStatus> {
  const spent = await readSpent();
  return {
    ok: spent < LIMIT_CENTS,
    spentCents: spent,
    limitCents: LIMIT_CENTS,
    remainingCents: Math.max(0, LIMIT_CENTS - spent),
  };
}

export async function recordSpend(costCents: number): Promise<void> {
  if (costCents <= 0) return;
  const current = await readSpent();
  await writeSpent(current + costCents);
}

export class BudgetExceededError extends Error {
  constructor(public status: BudgetStatus) {
    super(`Monthly AI budget exceeded (${status.spentCents}¢ / ${status.limitCents}¢)`);
    this.name = "BudgetExceededError";
  }
}
