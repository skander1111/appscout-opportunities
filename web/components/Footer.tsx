export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-lg font-bold">
          App<span className="text-emerald-400">Scout</span>
        </span>
        <p className="text-sm text-zinc-500 text-center">
          We find abandoned mobile apps with proven demand — before they appear on Flippa.
        </p>
        <a
          href="mailto:aloui.skander01@gmail.com"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          aloui.skander01@gmail.com
        </a>
      </div>
    </footer>
  );
}
