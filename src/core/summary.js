import { SOURCES, SOURCE_LABELS } from './sources.js';

const round2 = (n) => Math.round(n * 100) / 100;
const sum = (rows, key) => round2(rows.reduce((a, r) => a + r[key], 0));

export function buildView(entries) {
  const live = SOURCES.filter((s) => entries[s]);
  const combinedCurrent = round2(live.reduce((a, s) => a + sum(entries[s].rows, 'current'), 0));
  const combinedInvested = round2(live.reduce((a, s) => a + sum(entries[s].rows, 'invested'), 0));

  const sections = live.map((source) => {
    const e = entries[source];
    const rows = e.rows.map((r) => ({
      ...r,
      gain: round2(r.current - r.invested),
      share: combinedCurrent > 0 ? round2((r.current / combinedCurrent) * 100) : 0,
    }));
    const invested = sum(rows, 'invested');
    const current = sum(rows, 'current');
    return {
      source,
      label: SOURCE_LABELS[source],
      rows,
      invested,
      current,
      gain: round2(current - invested),
      syncedAt: e.syncedAt,
      partial: !!e.partial,
      failed: e.failed ?? [],
    };
  });

  const gain = round2(combinedCurrent - combinedInvested);
  return {
    sections,
    combined: {
      invested: combinedInvested,
      current: combinedCurrent,
      gain,
      gainPct: combinedInvested > 0 ? round2((gain / combinedInvested) * 100) : null,
    },
    missing: SOURCES.filter((s) => !entries[s]).map((s) => SOURCE_LABELS[s]),
  };
}
