"use client";

export interface GitHubProject {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  topics: string[];
  pushedAt: string;
  daysSincePush: number;
  owner: string;
  ownerType: string;
  license: string | null;
  classification: string;
}

function staleColor(days: number) {
  if (days >= 730) return 'text-red-400';
  if (days >= 365) return 'text-amber-400';
  return 'text-gray-400';
}

export default function GitHubCard({ project }: { project: GitHubProject }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#2e2e4e] transition-all group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-gray-500">{project.language || 'Unknown'}</span>
            {project.license && <span className="text-xs text-gray-600">{project.license}</span>}
          </div>
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-gray-500 truncate">{project.owner}</p>
        </div>
        <span className={`text-xs font-semibold shrink-0 ${staleColor(project.daysSincePush)}`}>
          {project.daysSincePush}d stale
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{project.description}</p>
      )}

      {project.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {project.topics.slice(0, 4).map(t => (
            <span key={t} className="text-xs text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>★ {project.stars.toLocaleString()}</span>
          <span>⎇ {project.forks}</span>
          {project.openIssues > 0 && <span className="text-amber-500/70">! {project.openIssues} issues</span>}
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          GitHub →
        </a>
      </div>
    </div>
  );
}
