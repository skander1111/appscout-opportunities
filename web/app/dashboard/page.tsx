"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Nav from "@/components/Nav";
import OpportunityCard from "@/components/OpportunityCard";
import SellerLeadCard from "@/components/SellerLeadCard";
import SignalCard from "@/components/SignalCard";
import GitHubCard, { GitHubProject } from "@/components/GitHubCard";

type AppOpp = {
  title: string;
  appId: string;
  url: string;
  developer: string;
  developerEmail?: string;
  installs: string;
  minInstalls: number;
  score: number;
  daysSinceUpdate: number;
  opportunityScore: number;
  ownerType: string;
  niche: string;
  platform: string;
  mainComplaints?: string[];
  classification: string;
};

type SellerLead = {
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
};

type Signal = {
  id: string;
  source: "hackernews" | "reddit" | "producthunt";
  title: string;
  url: string;
  points: number;
  comments: number;
  date: string;
  daysAgo: number;
  classification: "sell" | "acquire" | "trend" | "discuss";
  summary: string;
  niche?: string;
};

type Meta = { lastUpdated?: string; appsScored?: number };
type FilterType = "all" | "acquisition" | "rebuild" | "watch";
type SortType = "score" | "stale" | "installs";
type TabId = "overview" | "apps" | "sellers" | "github" | "signals" | "reports";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Live Opportunities", icon: "⚡" },
  { id: "apps", label: "Hidden App Targets", icon: "🎯" },
  { id: "sellers", label: "Public Seller Leads", icon: "💬" },
  { id: "github", label: "GitHub Projects", icon: "⚗️" },
  { id: "signals", label: "Signals", icon: "📡" },
  { id: "reports", label: "Weekly Reports", icon: "📋" },
];

const REPORTS = [
  {
    week: 21,
    title: "Week 21 — May 2026",
    desc: "247 apps scored · 8 acquisition targets · 22 rebuild opportunities · human-reviewed",
    isLatest: true,
    href: "https://skander46.gumroad.com/l/flfjnx",
  },
  {
    week: 2,
    title: "Week 2 Report",
    desc: "Early access edition",
    isLatest: false,
    href: "https://skander46.gumroad.com/l/flfjnx",
  },
  {
    week: 1,
    title: "Week 1 Report",
    desc: "Launch edition",
    isLatest: false,
    href: "https://skander46.gumroad.com/l/flfjnx",
  },
];

function timeAgo(iso?: string) {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatPill({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl px-4 py-3 min-w-0">
      <div className={`text-xl sm:text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 truncate">{label}</div>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="text-white font-semibold mb-2">{title}</div>
      <div className="text-gray-500 text-sm">{sub}</div>
    </div>
  );
}

function SectionHeader({ title, count, sub }: { title: string; count?: number; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {count !== undefined && (
        <span className="text-xs text-gray-600 bg-[#111118] border border-[#1e1e2e] px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
      {sub && <span className="text-xs text-gray-600">{sub}</span>}
    </div>
  );
}

function applyFilter(apps: AppOpp[], filter: FilterType): AppOpp[] {
  if (filter === "acquisition") return apps.filter((a) => a.daysSinceUpdate >= 365);
  if (filter === "rebuild") return apps.filter((a) => a.daysSinceUpdate >= 180 && a.daysSinceUpdate < 365);
  if (filter === "watch") return apps.filter((a) => a.daysSinceUpdate >= 120 && a.daysSinceUpdate < 180);
  return apps;
}

function applySort(apps: AppOpp[], sort: SortType): AppOpp[] {
  const copy = [...apps];
  if (sort === "score") return copy.sort((a, b) => b.opportunityScore - a.opportunityScore);
  if (sort === "stale") return copy.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
  if (sort === "installs") return copy.sort((a, b) => (b.minInstalls || 0) - (a.minInstalls || 0));
  return copy;
}

export default function DashboardPage() {
  const [tab, setTab] = useState<TabId>("overview");
  const [allApps, setAllApps] = useState<AppOpp[]>([]);
  const [leads, setLeads] = useState<SellerLead[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [github, setGithub] = useState<GitHubProject[]>([]);
  const [meta, setMeta] = useState<Meta>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("score");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [appsRes, leadsRes, signalsRes, githubRes, metaRes] = await Promise.all([
        fetch("/api/opportunities?limit=100"),
        fetch("/api/seller-leads"),
        fetch("/api/signals"),
        fetch("/api/github-projects"),
        fetch("/api/meta"),
      ]);
      const [appsData, leadsData, signalsData, githubData, metaData] = await Promise.all([
        appsRes.json(),
        leadsRes.json(),
        signalsRes.json(),
        githubRes.json(),
        metaRes.json(),
      ]);
      setAllApps(appsData.apps || []);
      setLeads(leadsData.leads || []);
      setSignals(signalsData.signals || []);
      setGithub(githubData.projects || []);
      setMeta(metaData);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const nicheBase = selectedNiche ? allApps.filter((a) => a.niche === selectedNiche) : allApps;
  const filteredApps = applySort(applyFilter(nicheBase, filter), sort);
  const acquireApps = allApps.filter((a) => a.daysSinceUpdate >= 365);
  const rebuildApps = allApps.filter((a) => a.daysSinceUpdate >= 180 && a.daysSinceUpdate < 365);

  const niches = useMemo(() => {
    const counts: Record<string, number> = {};
    allApps.forEach((a) => { counts[a.niche] = (counts[a.niche] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allApps]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <Nav />

      <div className="pt-16">
        {/* Dashboard header */}
        <div className="border-b border-[#1e1e2e]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  App<span className="text-neon">Scout</span> Intelligence
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Live engine · auto-refreshes every 60s ·{" "}
                  {lastRefresh ? `updated ${timeAgo(lastRefresh.toISOString())}` : "loading…"}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-neon rounded-full animate-pulse" />
                <span className="text-xs text-neon font-medium">Engine online</span>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              <StatPill label="Apps scanned" value={meta.appsScored ?? 247} />
              <StatPill label="Opportunities" value={allApps.length} color="text-neon" />
              <StatPill label="Acquire (365d+)" value={acquireApps.length} color="text-neon" />
              <StatPill label="Rebuild (180d+)" value={rebuildApps.length} color="text-blue-400" />
              <StatPill label="Seller leads" value={leads.length} color="text-purple-400" />
              <StatPill label="Signals" value={signals.length} color="text-zinc-400" />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-b border-[#1e1e2e] sticky top-16 z-40 bg-[#0a0a0f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex gap-0 overflow-x-auto -mb-px">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? "border-neon text-neon"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span className="hidden sm:inline">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="space-y-2 text-center">
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
                  style={{ borderColor: "rgba(0,255,136,0.2)", borderTopColor: "#00ff88" }}
                />
                <p className="text-gray-500 text-sm">Loading intelligence data…</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ─────────────────────────────────── */}
              {tab === "overview" && (
                <div className="space-y-12">
                  <div>
                    <SectionHeader
                      title="Top Acquisition Targets"
                      count={acquireApps.length}
                      sub="365+ days stale · indie owner · direct contact"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {acquireApps
                        .sort((a, b) => b.opportunityScore - a.opportunityScore)
                        .slice(0, 4)
                        .map((app) => (
                          <OpportunityCard key={app.appId} app={app} />
                        ))}
                      {acquireApps.length === 0 && (
                        <EmptyState icon="🎯" title="No acquisition targets yet" sub="Engine will find them on next scan" />
                      )}
                    </div>
                    {acquireApps.length > 4 && (
                      <button
                        onClick={() => setTab("apps")}
                        className="mt-4 text-xs text-neon hover:opacity-70 transition-opacity"
                      >
                        View all {acquireApps.length} acquisition targets →
                      </button>
                    )}
                  </div>

                  <div>
                    <SectionHeader
                      title="Top Rebuild Opportunities"
                      count={rebuildApps.length}
                      sub="180–364 days stale · active user base"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {rebuildApps
                        .sort((a, b) => b.opportunityScore - a.opportunityScore)
                        .slice(0, 4)
                        .map((app) => (
                          <OpportunityCard key={app.appId} app={app} />
                        ))}
                      {rebuildApps.length === 0 && (
                        <EmptyState icon="🔨" title="No rebuild opportunities yet" sub="Engine will classify them on next scan" />
                      )}
                    </div>
                    {rebuildApps.length > 4 && (
                      <button
                        onClick={() => { setFilter("rebuild"); setTab("apps"); }}
                        className="mt-4 text-xs text-neon hover:opacity-70 transition-opacity"
                      >
                        View all {rebuildApps.length} rebuild opportunities →
                      </button>
                    )}
                  </div>

                  {leads.length > 0 && (
                    <div>
                      <SectionHeader title="Latest Seller Leads" count={leads.length} sub="sourced from Reddit" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leads.slice(0, 3).map((lead) => (
                          <SellerLeadCard key={lead.id} lead={lead} />
                        ))}
                      </div>
                      {leads.length > 3 && (
                        <button
                          onClick={() => setTab("sellers")}
                          className="mt-4 text-xs text-neon hover:opacity-70 transition-opacity"
                        >
                          View all {leads.length} seller leads →
                        </button>
                      )}
                    </div>
                  )}

                  {signals.length > 0 && (
                    <div>
                      <SectionHeader title="Latest Signals" count={signals.length} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {signals.slice(0, 3).map((s) => (
                          <SignalCard key={s.id} signal={s} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Niche intelligence grid */}
                  {niches.length > 0 && (
                    <div>
                      <SectionHeader title="Niche Intelligence" sub="click to explore" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {niches.map(([niche, count]) => {
                          const maxCount = niches[0][1];
                          const intensity = count / maxCount;
                          return (
                            <button
                              key={niche}
                              onClick={() => { setSelectedNiche(niche); setFilter("all"); setTab("apps"); }}
                              className="bg-[#111118] border border-[#1e1e2e] hover:border-neon/30 rounded-lg p-3 text-left transition-all group"
                              style={{ background: `rgba(0,255,136,${intensity * 0.06})` }}
                            >
                              <div className="text-sm font-bold text-white group-hover:text-neon transition-colors">
                                {count}
                              </div>
                              <div className="text-[11px] text-gray-500 truncate">{niche}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {leads.length === 0 && signals.length === 0 && niches.length === 0 && (
                    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 text-center">
                      <p className="text-gray-500 text-sm">
                        Seller leads and signals coming soon — engine will populate these automatically.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── HIDDEN APP TARGETS ───────────────────────── */}
              {tab === "apps" && (
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex gap-1 bg-[#111118] border border-[#1e1e2e] rounded-lg p-1">
                      {(
                        [
                          { id: "all", label: "All" },
                          { id: "acquisition", label: "Acquire (365d+)" },
                          { id: "rebuild", label: "Rebuild (180d+)" },
                          { id: "watch", label: "Partner (120d+)" },
                        ] as { id: FilterType; label: string }[]
                      ).map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id)}
                          className={`text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                            filter === f.id
                              ? "bg-neon/15 text-neon"
                              : "text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 bg-[#111118] border border-[#1e1e2e] rounded-lg p-1">
                      {(
                        [
                          { id: "score", label: "By Score" },
                          { id: "stale", label: "Stalest" },
                          { id: "installs", label: "Most Installs" },
                        ] as { id: SortType; label: string }[]
                      ).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSort(s.id)}
                          className={`text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                            sort === s.id
                              ? "bg-blue-500/20 text-blue-400"
                              : "text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">{filteredApps.length} results</span>
                  </div>

                  {/* Niche filter chips */}
                  {niches.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      <button
                        onClick={() => setSelectedNiche(null)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          selectedNiche === null
                            ? "border-neon/50 text-neon bg-neon/10"
                            : "border-[#2e2e4e] text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        All niches
                      </button>
                      {niches.map(([niche, count]) => (
                        <button
                          key={niche}
                          onClick={() => setSelectedNiche(niche === selectedNiche ? null : niche)}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            selectedNiche === niche
                              ? "border-neon/50 text-neon bg-neon/10"
                              : "border-[#2e2e4e] text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {niche} <span className="opacity-50">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredApps.map((app) => (
                      <OpportunityCard key={app.appId} app={app} />
                    ))}
                    {filteredApps.length === 0 && (
                      <EmptyState icon="🔍" title="No apps match this filter" sub="Try selecting a different category" />
                    )}
                  </div>
                </div>
              )}

              {/* ── PUBLIC SELLER LEADS ──────────────────────── */}
              {tab === "sellers" && (
                <div>
                  <div className="mb-6">
                    <p className="text-xs text-gray-500">
                      Sourced automatically from Reddit ·{" "}
                      <span className="text-gray-600">r/AppBusiness · r/startups · r/SideProject</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map((lead) => (
                      <SellerLeadCard key={lead.id} lead={lead} />
                    ))}
                    {leads.length === 0 && (
                      <EmptyState icon="💬" title="No seller leads yet" sub="Engine scans Reddit every few hours for people selling apps" />
                    )}
                  </div>
                </div>
              )}

              {/* ── GITHUB PROJECTS ──────────────────────────── */}
              {tab === "github" && (
                <div>
                  <div className="mb-6">
                    <p className="text-xs text-gray-500">
                      Abandoned GitHub projects with real user traction — rebuild or acquire the codebase
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {github.map((p) => (
                      <GitHubCard key={p.fullName} project={p} />
                    ))}
                    {github.length === 0 && (
                      <EmptyState icon="⚗️" title="GitHub scanner coming soon" sub="Will surface abandoned repos with stars, forks, and real user demand" />
                    )}
                  </div>
                </div>
              )}

              {/* ── SIGNALS ──────────────────────────────────── */}
              {tab === "signals" && (
                <div>
                  <div className="mb-6">
                    <p className="text-xs text-gray-500">
                      Real-time signals from Hacker News · Reddit · Product Hunt · market movement
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {signals.map((s) => (
                      <SignalCard key={s.id} signal={s} />
                    ))}
                    {signals.length === 0 && (
                      <EmptyState icon="📡" title="Signal scanner coming soon" sub="Will track HN, Reddit, and PH for acquisition signals, seller posts, and market trends" />
                    )}
                  </div>
                </div>
              )}

              {/* ── WEEKLY REPORTS ───────────────────────────── */}
              {tab === "reports" && (
                <div className="max-w-2xl">
                  <p className="text-gray-500 text-sm mb-8">
                    Every Friday at 08:00 — frozen snapshot of the week&apos;s best opportunities.
                    Human-reviewed, scored, and ready to act on.
                  </p>
                  <div className="space-y-4">
                    {REPORTS.map((r) => (
                      <div
                        key={r.week}
                        className="bg-[#111118] rounded-xl p-5 flex items-center justify-between gap-4"
                        style={{
                          border: r.isLatest ? "1px solid rgba(0,255,136,0.25)" : "1px solid #1e1e2e",
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{r.title}</span>
                            {r.isLatest && (
                              <span
                                className="text-xs text-black font-bold px-2 py-0.5 rounded-full shrink-0"
                                style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
                              >
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{r.desc}</p>
                        </div>
                        <a
                          href={r.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-black font-semibold px-4 py-2 rounded-lg transition-all whitespace-nowrap shrink-0"
                          style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
                        >
                          Get report →
                        </a>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-4 bg-[#111118] border border-[#1e1e2e] rounded-xl">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      <span className="text-gray-300 font-medium">Next report:</span> Friday, 30 May 2026 at 08:00.
                      Reports are auto-generated by the engine then human-reviewed before publish.
                      Subscribers get email delivery within minutes of release.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
