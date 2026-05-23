"use client";

interface SellerLead {
  id: number;
  title: string;
  subreddit: string;
  url: string;
  author: string;
  date: string;
  daysAgo: number;
  askingPrice: string;
  appName: string;
  classification: string;
  priority: string;
  risk: string;
  action: string;
  notes: string;
  nextStep: string;
  redFlags: string[];
}

function priorityStyle(priority: string) {
  if (priority === 'HIGH') return 'text-neon bg-neon/10 border-neon/30';
  if (priority === 'MEDIUM') return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
}

function freshnessLabel(daysAgo: number) {
  if (daysAgo <= 7) return { label: `${daysAgo}d ago`, color: 'text-neon' };
  if (daysAgo <= 30) return { label: `${daysAgo}d ago`, color: 'text-zinc-400' };
  if (daysAgo <= 90) return { label: `${Math.round(daysAgo / 30)}mo ago`, color: 'text-gray-400' };
  return { label: `${Math.round(daysAgo / 30)}mo ago`, color: 'text-gray-600' };
}

export default function SellerLeadCard({ lead }: { lead: SellerLead }) {
  const freshness = freshnessLabel(lead.daysAgo);

  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#2e2e4e] transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">{lead.subreddit}</span>
            <span className={`text-xs ${freshness.color}`}>{freshness.label}</span>
          </div>
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
            {lead.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityStyle(lead.priority)}`}>
            {lead.priority}
          </span>
          {lead.askingPrice && lead.askingPrice !== 'Not stated' && (
            <span className="text-xs text-white font-semibold">{lead.askingPrice}</span>
          )}
        </div>
      </div>

      {lead.notes && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{lead.notes}</p>
      )}

      {lead.redFlags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.redFlags.slice(0, 2).map((flag, i) => (
            <span key={i} className="text-xs text-red-400/70 bg-red-500/10 px-2 py-0.5 rounded-full">
              ⚠ {flag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{lead.author}</span>
        <a
          href={lead.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Open thread →
        </a>
      </div>
    </div>
  );
}
