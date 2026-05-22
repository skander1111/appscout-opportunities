export function generateMarkdownReport(data) {
  const { timestamp, stats, topOpportunities, acquisitionTargets, rebuildTargets,
    nicheRanking, falsePositives, externalSignals } = data;

  const lines = [
    '# AppScout Research Report',
    `**Generated:** ${timestamp}`,
    `**Apps analyzed:** ${stats.totalApps} | **Niches tested:** ${stats.totalNiches}`,
    `**Acquisition targets:** ${stats.acquisitionTargets} | **Rebuild opportunities:** ${stats.rebuildTargets}`,
    '',
    '---',
    '',
    '## Niche Rankings',
    '',
    '| Rank | Niche | Apps | Avg Score | % Abandoned | Strong | Acquire | Rebuild |',
    '|------|-------|------|-----------|-------------|--------|---------|---------|',
    ...nicheRanking.map((n, i) =>
      `| ${i + 1} | ${n.niche} | ${n.apps} | ${n.avgScore} | ${n.pctAbandoned}% | ${n.strong} | ${n.acquire} | ${n.rebuild} |`
    ),
    '',
    '---',
    '',
    '## Top 20 Opportunities',
    '',
  ];

  topOpportunities.slice(0, 20).forEach((app, i) => {
    lines.push(`### ${i + 1}. ${app.title}`);
    lines.push(`- **Score:** ${app.opportunityScore} | **Class:** ${app.classification} | **Strategy:** ${app.strategy}`);
    lines.push(`- **Installs:** ${app.installs} | **Rating:** ${app.score ?? 'N/A'} | **Days inactive:** ${app.daysSinceUpdate}`);
    lines.push(`- **Developer:** ${app.developer} | **Email:** ${app.developerEmail || '—'}`);
    lines.push(`- **Niche:** ${app.niche}`);
    if (app.mainComplaints?.length) lines.push(`- **Complaints:** ${app.mainComplaints.join(', ')}`);
    if (app.rebuildSignal) lines.push(`- **Rebuild signal:** ${app.rebuildSignal}`);
    lines.push(`- **URL:** ${app.url}`);
    lines.push('');
  });

  lines.push('---', '', '## Acquisition Targets', '');
  acquisitionTargets.slice(0, 10).forEach(app => {
    lines.push(`- **${app.title}** — ${app.installs}, ${app.daysSinceUpdate}d inactive, score ${app.opportunityScore}`);
    lines.push(`  - Email: ${app.developerEmail || 'not found'} | Rating: ${app.score}`);
  });

  lines.push('', '---', '', '## Rebuild Opportunities', '');
  rebuildTargets.slice(0, 10).forEach(app => {
    lines.push(`- **${app.title}** — ${app.installs}, rating ${app.score}, ${app.daysSinceUpdate}d inactive`);
    if (app.mainComplaints?.length) lines.push(`  - Issues: ${app.mainComplaints.join(', ')}`);
  });

  lines.push('', '---', '', '## External Signals', '');
  for (const [niche, signals] of Object.entries(externalSignals || {})) {
    lines.push(`### ${niche}`);
    if (signals.github?.repos?.length) {
      lines.push(`**GitHub** — ${signals.github.repos.length} abandoned repos found`);
      signals.github.repos.slice(0, 2).forEach(r => {
        lines.push(`- [${r.name}](${r.url}) — ⭐${r.stars}, last push: ${r.lastPush}, license: ${r.license}`);
      });
    }
    if (signals.reddit?.topPost) {
      lines.push(`**Reddit demand:** ${signals.reddit.demandStrength} (${signals.reddit.totalEngagement} total engagement)`);
      lines.push(`- Top post: "${signals.reddit.topPost.title}" (${signals.reddit.topPost.score} upvotes)`);
    }
    lines.push('');
  }

  lines.push('---', '', '## False Positives', '');
  falsePositives.slice(0, 10).forEach(app => {
    lines.push(`- ${app.title} (${app.developer}) — ${app.classification}`);
  });

  lines.push('', '---', '', '## Next Research Steps', '');
  lines.push('1. Manually verify developer emails for top 5 acquisition targets');
  lines.push('2. Deep-scan the top 2 niches with 100+ apps');
  lines.push('3. Check App Store for iOS expansion signals in top niches');
  lines.push('4. Search Flippa/Acquire for similar listed assets to validate pricing');
  lines.push('5. Draft outreach message templates for each acquisition target');

  return lines.join('\n');
}
