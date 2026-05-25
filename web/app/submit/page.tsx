"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const ASKING = [
  { id: "buyer",    icon: "💰", label: "I want to sell",   blurb: "Looking for a buyer for your app, codebase, or company." },
  { id: "partner",  icon: "🤝", label: "I want a partner", blurb: "Looking for a co-founder or growth partner." },
  { id: "builder",  icon: "🔨", label: "I want a builder", blurb: "Looking for someone to build / take over development." },
  { id: "investor", icon: "💸", label: "I want investors", blurb: "Raising capital or pre-seed angels." },
  { id: "feedback", icon: "💬", label: "I want feedback",  blurb: "Just want operator eyes on it." },
] as const;

const STAGES = [
  { id: "idea",      label: "Idea" },
  { id: "mvp",       label: "MVP" },
  { id: "launched",  label: "Launched" },
  { id: "abandoned", label: "Abandoned" },
  { id: "for-sale",  label: "For sale" },
] as const;

const PLATFORMS = ["Web", "iOS", "Android", "SaaS", "AI", "Hardware", "Other"];

export default function SubmitPage() {
  const [form, setForm] = useState({
    projectName: "",
    description: "",
    stage: "mvp" as (typeof STAGES)[number]["id"],
    platform: "Web",
    asking: "feedback" as (typeof ASKING)[number]["id"],
    price: "",
    contact: "",
    url: "",
    github: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "submission failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#050508] text-white">
        <Nav />
        <div className="pt-32 px-6 max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">✅</div>
          <h1 className="text-3xl font-bold mb-3">Submission received</h1>
          <p className="text-zinc-400 mb-8">
            Your project has been added to the AppScout marketplace queue.
            Yearly members see it first; we&apos;ll email you if there&apos;s a match.
          </p>
          <a
            href="/terminal"
            className="inline-block font-bold px-7 py-3.5 rounded-xl text-sm text-black"
            style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
          >
            Browse the terminal →
          </a>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Project marketplace</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Submit your app, idea, or unfinished project</h1>
            <p className="text-zinc-400">
              Tell us what you have and what you&apos;re looking for. AppScout matches submissions with operators in our network.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* what are you asking for */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3 block">What are you looking for?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ASKING.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => update("asking", a.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      form.asking === a.id
                        ? "border-neon/40 bg-neon/5"
                        : "border-[#1a1a26] bg-[#0a0a10] hover:border-[#2a2a3e]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{a.icon}</span>
                      <span className="text-sm font-semibold">{a.label}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">{a.blurb}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* project name */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-2 block">Project name</label>
              <input
                type="text"
                value={form.projectName}
                onChange={(e) => update("projectName", e.target.value)}
                required
                maxLength={100}
                placeholder="e.g. HabitTracker, SendRight, PdfMaster"
                className="w-full bg-[#0a0a10] border border-[#1a1a26] rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none"
              />
            </div>

            {/* description */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-2 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                required
                minLength={20}
                maxLength={1200}
                rows={5}
                placeholder="What it does, who uses it, traction so far, why you're posting it here, what you'd consider a success outcome."
                className="w-full bg-[#0a0a10] border border-[#1a1a26] rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none resize-none"
              />
              <p className="text-[10px] text-zinc-600 mt-1 font-mono">{form.description.length}/1200</p>
            </div>

            {/* stage + platform */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-2 block">Stage</label>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => update("stage", s.id)}
                      className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                        form.stage === s.id
                          ? "border-neon/40 bg-neon/10 text-neon"
                          : "border-[#1a1a26] bg-[#0a0a10] text-zinc-400 hover:border-[#2a2a3e]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-2 block">Platform</label>
                <select
                  value={form.platform}
                  onChange={(e) => update("platform", e.target.value)}
                  className="w-full bg-[#0a0a10] border border-[#1a1a26] rounded-lg px-4 py-2.5 text-sm text-white focus:border-neon/40 focus:outline-none"
                >
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* price (conditional) */}
            {(form.asking === "buyer" || form.asking === "investor") && (
              <div>
                <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-2 block">
                  {form.asking === "buyer" ? "Asking price" : "Raise target"} (optional)
                </label>
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  maxLength={30}
                  placeholder={form.asking === "buyer" ? "$4,000" : "$50k seed"}
                  className="w-full bg-[#0a0a10] border border-[#1a1a26] rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none"
                />
              </div>
            )}

            {/* contact */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-2 block">Your email</label>
              <input
                type="email"
                value={form.contact}
                onChange={(e) => update("contact", e.target.value)}
                required
                maxLength={120}
                placeholder="you@example.com"
                className="w-full bg-[#0a0a10] border border-[#1a1a26] rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none"
              />
              <p className="text-[10px] text-zinc-600 mt-1">Never shown publicly. Used only to forward matches to you.</p>
            </div>

            {/* links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-2 block">Website / app URL (optional)</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => update("url", e.target.value)}
                  maxLength={200}
                  placeholder="https://…"
                  className="w-full bg-[#0a0a10] border border-[#1a1a26] rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-2 block">GitHub repo (optional)</label>
                <input
                  type="url"
                  value={form.github}
                  onChange={(e) => update("github", e.target.value)}
                  maxLength={200}
                  placeholder="https://github.com/…"
                  className="w-full bg-[#0a0a10] border border-[#1a1a26] rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-neon/40 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full font-bold px-7 py-4 rounded-xl text-sm text-black disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
                boxShadow: "0 0 25px rgba(0,255,136,0.4)",
              }}
            >
              {submitting ? "Submitting…" : "Submit project →"}
            </button>

            <p className="text-[11px] text-zinc-600 text-center">
              Free to submit. Yearly members get priority placement + AI-matched buyer outreach.
            </p>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  );
}
