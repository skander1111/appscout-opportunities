export default function CancelPage() {
  return (
    <main className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-800/50 border border-white/10 flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-4">Payment cancelled</h1>
        <p className="text-zinc-400 text-lg leading-relaxed mb-8">
          No charge was made. You can go back and try again whenever you&apos;re ready.
        </p>

        <a
          href="/#pricing"
          className="inline-block text-black font-semibold px-8 py-3.5 rounded-xl text-sm transition-all mb-4"
          style={{
            background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
            boxShadow: "0 0 25px rgba(0,255,136,0.3)",
          }}
        >
          Back to pricing
        </a>

        <p className="text-sm text-zinc-500 mt-6">
          Questions?{" "}
          <a href="mailto:aloui.skander01@gmail.com" className="text-neon hover:opacity-80 transition-opacity">
            aloui.skander01@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
