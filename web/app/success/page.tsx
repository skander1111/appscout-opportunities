export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-6">
      <div className="max-w-lg mx-auto text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{
            background: "rgba(0,255,136,0.08)",
            border: "1px solid rgba(0,255,136,0.25)",
            boxShadow: "0 0 40px rgba(0,255,136,0.15)",
          }}
        >
          <svg className="w-10 h-10 text-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-4">Payment confirmed</h1>

        <p className="text-zinc-400 text-lg leading-relaxed mb-8">
          Check your email — Gumroad sends the download link automatically.
          If you don&apos;t see it within a few minutes, check your spam folder.
        </p>

        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 text-left mb-8">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">What&apos;s inside your report</h2>
          <ul className="space-y-2.5">
            {[
              "5 acquisition targets — 365+ days stale, owner emails included",
              "5 rebuild opportunities — active user base, fixable problems",
              "Ready-to-send outreach email for each target",
              "Risk flags and due diligence checklist per app",
              "Do-not-contact list with reasons",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="text-neon mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-zinc-500 mb-6">
          Questions?{" "}
          <a href="mailto:aloui.skander01@gmail.com" className="text-neon hover:opacity-80 transition-opacity">
            aloui.skander01@gmail.com
          </a>
        </p>

        <a
          href="/"
          className="inline-block text-sm text-zinc-400 hover:text-white transition-colors border border-white/10 hover:border-white/25 px-6 py-2.5 rounded-xl"
        >
          ← Back to AppScout
        </a>
      </div>
    </main>
  );
}
