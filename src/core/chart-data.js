const TOP = 6;

// Allocation by current value: the largest funds, the rest folded into "Others".
export function allocation(view, top = TOP) {
  const all = view.sections.flatMap((s) => s.rows).filter((r) => r.current > 0).sort((a, b) => b.current - a.current);
  const total = all.reduce((a, r) => a + r.current, 0);
  if (total <= 0) return [];
  const slices = all.slice(0, top).map((r) => ({ label: r.fundName, value: r.current }));
  const rest = all.slice(top).reduce((a, r) => a + r.current, 0);
  if (rest > 0) slices.push({ label: 'Others', value: Math.round(rest * 100) / 100 });
  return slices.map((s) => ({ ...s, pct: (s.value / total) * 100 }));
}

// Source split for the combined portfolio.
export function bySource(view) {
  const total = view.combined.current;
  return view.sections.map((s) => ({ label: s.label, value: s.current, pct: total > 0 ? (s.current / total) * 100 : 0 }));
}

// Per-fund invested vs current, largest holdings first.
export function investedVsCurrent(view, top = 10) {
  return view.sections.flatMap((s) => s.rows).sort((a, b) => b.current - a.current).slice(0, top)
    .map((r) => ({ label: r.fundName, invested: r.invested, current: r.current }));
}

// Gain % per fund (funds with no invested amount are skipped), best first.
export function gainPerFund(view, top = 10) {
  return view.sections.flatMap((s) => s.rows).filter((r) => r.invested > 0)
    .map((r) => ({ label: r.fundName, pct: (r.gain / r.invested) * 100 }))
    .sort((a, b) => b.pct - a.pct).slice(0, top);
}
