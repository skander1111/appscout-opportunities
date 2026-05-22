"use client";

export interface Signal {
  id: string;
  source: 'hackernews' | 'reddit' | 'producthunt';
  title: string;
  url: string;
  points: number;
  comments: number;
  date: string;
  daysAgo: number;
  classification: 'sell' | 'acquire' | 'trend' | 'discuss';
  summary: string;
  niche?: string;
}

function sourceStyle(source: string) {
  if (source === 'hackernews') return { label: 'HN', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
  if (source === 'reddit') return { label: 'Reddit', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
  return { label: 'PH', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
}

function classStyle(c: string) {
  if (c === 'sell') return 'text-emerald-400';
  if (c === 'acquire') return 'text-blue-400';
  if (c === 'trend') return 'text-purple-400';
  return 'text-gray-400';
}

export default function SignalCard({ signal }: { signal: Signal }) {
  const src = sourceStyle(signal.source);

  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#2e2e4e] transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${src.color}`}>{src.label}</span>
          <span className={`text-xs font-medium ${classStyle(signal.classification)}`}>{signal.classification}</span>
          {signal.niche && <span className="text-xs text-gray-600">{signal.niche}</span>}
        </div>
        <span className="text-xs text-gray-600 shrink-0">{signal.daysAgo}d ago</span>
      </div>

      <h3 className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2">
        {signal.title}
      </h3>

      {signal.summary && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{signal.summary}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {signal.points > 0 && <span>▲ {signal.points}</span>}
          {signal.comments > 0 && <span>💬 {signal.comments}</span>}
        </div>
        <a
          href={signal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Read →
        </a>
      </div>
    </div>
  );
}
