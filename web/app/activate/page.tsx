"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { activateLicense, useLicense, signOutLicense, tierLabel, formatRemaining } from "@/lib/useLicense";

function ActivateInner() {
  const params = useSearchParams();
  const initial = params.get("code") || "";
  const [code, setCode] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const { status, loading, refresh } = useLicense();

  useEffect(() => {
    if (initial && initial.length >= 10 && !status?.valid && !loading) {
      void activate(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, loading]);

  async function activate(value: string) {
    setBusy(true);
    setError(null);
    const r = await activateLicense(value);
    setBusy(false);
    if (r.ok) {
      setOk(true);
      refresh();
    } else {
      setError(r.error || "Activation failed");
    }
  }

  async function onSignOut() {
    await signOutLicense();
    setOk(false);
    setCode("");
  }

  if (status?.valid) {
    return (
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-5xl mb-6">🔓</div>
          <h1 className="text-3xl font-bold mb-3">
            {tierLabel(status.tier)} access active
          </h1>
          <p className="text-zinc-400 mb-1">{formatRemaining(status)}</p>
          {status.expiresAt && (
            <p className="text-[11px] text-zinc-600 font-mono mb-8">
              expires {new Date(status.expiresAt).toLocaleString()}
            </p>
          )}
          <div className="flex justify-center gap-3">
            <a
              href="/terminal"
              className="font-bold px-6 py-3 rounded-xl text-sm text-black"
              style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
            >
              Open terminal →
            </a>
            <button
              onClick={onSignOut}
              className="font-semibold px-6 py-3 rounded-xl text-sm text-zinc-400 border border-white/10 hover:border-white/25 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Activate license</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Unlock AI features</h1>
          <p className="text-zinc-400">
            Paste the license code from your Gumroad receipt. AppScout activates instantly — no account needed.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (code.trim().length >= 10) activate(code.trim()); }}
          className="space-y-4"
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="AS-XXXX-XXXX-XXXX-XXXX"
            className="w-full bg-[#0a0a10] border border-[#1a1a26] rounded-xl px-4 py-4 text-sm text-white font-mono tracking-wider placeholder-zinc-600 focus:border-neon/40 focus:outline-none"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">{error}</div>
          )}
          {ok && (
            <div className="bg-neon/10 border border-neon/30 rounded-lg p-3 text-sm text-neon">License activated.</div>
          )}

          <button
            type="submit"
            disabled={busy || code.trim().length < 10}
            className="w-full font-bold px-6 py-3.5 rounded-xl text-sm text-black disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
          >
            {busy ? "Activating…" : "Activate"}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-zinc-400 mb-3">No code yet?</p>
          <a
            href="/#pricing"
            className="inline-block text-sm font-semibold text-neon hover:opacity-80"
          >
            See pricing →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />
      <Suspense fallback={<div className="pt-24 px-6 text-zinc-500 text-sm">Loading…</div>}>
        <ActivateInner />
      </Suspense>
      <Footer />
    </main>
  );
}
