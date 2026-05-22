const COLS = [
  'title', 'niche', 'platform', 'installs', 'score', 'daysSinceUpdate',
  'opportunityScore', 'classification', 'strategy',
  'developer', 'developerEmail', 'updatedDate', 'released', 'url',
];

export function toCsv(apps) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = apps.map(a => COLS.map(c => esc(a[c])).join(','));
  return [COLS.join(','), ...rows].join('\n');
}
