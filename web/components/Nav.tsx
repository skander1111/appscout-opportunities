export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-sm">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <a href="/" className="text-lg font-bold tracking-tight flex-shrink-0">
          App<span className="text-emerald-400">Scout</span>
        </a>
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <a
            href="/#how-it-works"
            className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block whitespace-nowrap"
          >
            How it works
          </a>
          <a
            href="/#pricing"
            className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block whitespace-nowrap"
          >
            Pricing
          </a>
          <a
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block whitespace-nowrap"
          >
            Live Dashboard
          </a>
          <a
            href="/#pricing"
            className="text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
          >
            Get the report
          </a>
        </div>
      </div>
    </nav>
  );
}
