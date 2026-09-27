import { TTL_MS } from '../core/store.js';

const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatInr = (n) => `${n < 0 ? '-' : ''}₹${inr.format(Math.abs(n))}`;
export function formatAgo(ms) {
  const min = Math.floor(ms / 60_000);
  return min < 1 ? 'just now' : `${min} min ago`;
}
const pct = (n) => (n === null ? 'n/a' : `${n.toFixed(2)}%`);

function el(doc, tag, props = {}, ...kids) {
  const node = doc.createElement(tag);
  const { className, text, ...rest } = props;
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [k, v] of Object.entries(rest)) node.setAttribute(k, v);
  for (const kid of kids) node.append(kid);
  return node;
}

const COLUMNS = [
  { key: 'fundName', label: 'Fund', num: false },
  { key: 'invested', label: 'Invested', num: true },
  { key: 'current', label: 'Current', num: true },
  { key: 'gain', label: 'Gain', num: true, full: true },
  { key: 'share', label: 'Share', num: true, full: true },
];
const cellText = (col, row) => {
  if (col.key === 'fundName') return row.fundName;
  if (col.key === 'share') return `${row.share.toFixed(1)}%`;
  return formatInr(row[col.key]);
};

export function renderPortfolio(doc, container, view, opts = {}) {
  const { now = Date.now(), compact = false, sort = { key: 'current', dir: 'desc' } } = opts;
  const rerender = (next) => {
    opts.onSortChange?.(next);
    renderPortfolio(doc, container, view, { ...opts, sort: next });
  };
  const columns = COLUMNS.filter((c) => compact ? !c.full : true);
  container.replaceChildren();

  if (view.sections.length === 0) {
    container.append(el(doc, 'p', { className: 'empty', text: `No data yet. Open your portfolio, then click "Sync this site". Synced data is kept for ${TTL_MS / 60000} min.` }));
    const links = el(doc, 'p', { className: 'quick-links' });
    for (const [label, href] of [['Open myCAMS', 'https://newmycams.camsonline.com/'], ['Open KFintech', 'https://mfs.kfintech.com/']]) {
      links.append(el(doc, 'a', { className: 'link', text: `${label} \u2197`, href, target: '_blank', rel: 'noopener noreferrer' }));
    }
    container.append(links);
  }

  for (const s of view.sections) {
    const rows = [...s.rows].sort((a, b) => {
      const cmp = typeof a[sort.key] === 'string' ? a[sort.key].localeCompare(b[sort.key]) : a[sort.key] - b[sort.key];
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    const section = el(doc, 'section', { className: 'source' });
    section.append(el(doc, 'h2', { text: s.label }));
    const left = Math.max(0, Math.ceil((TTL_MS - (now - s.syncedAt)) / 60_000));
    section.append(el(doc, 'p', { className: 'meta', text: `Synced ${formatAgo(now - s.syncedAt)}, expires in ${left} min` }));
    if (s.partial) section.append(el(doc, 'p', { className: 'warn', text: `Partial sync. Not loaded: ${s.failed.join(', ')}. Run Sync again.` }));

    const head = el(doc, 'tr');
    for (const col of columns) {
      const th = el(doc, 'th', { text: col.label, className: col.num ? 'num' : '' });
      th.addEventListener('click', () => rerender({ key: col.key, dir: sort.key === col.key && sort.dir === 'asc' ? 'desc' : 'asc' }));
      head.append(th);
    }
    const body = el(doc, 'tbody');
    for (const row of rows) {
      const tr = el(doc, 'tr');
      for (const col of columns) tr.append(el(doc, 'td', { text: cellText(col, row), className: col.num ? 'num' : '' }));
      body.append(tr);
    }
    const foot = el(doc, 'tr', { className: 'total' });
    const totals = { fundName: 'Total', invested: formatInr(s.invested), current: formatInr(s.current), gain: formatInr(s.gain), share: '' };
    for (const col of columns) foot.append(el(doc, 'td', { text: totals[col.key], className: col.num ? 'num' : '' }));
    section.append(el(doc, 'table', {}, el(doc, 'thead', {}, head), body, el(doc, 'tfoot', {}, foot)));
    container.append(section);
  }

  if (view.sections.length > 0) {
    const c = view.combined;
    const box = el(doc, 'section', { className: 'combined' });
    box.append(el(doc, 'h2', { text: 'Combined' }));
    box.append(el(doc, 'p', { text: `Invested ${formatInr(c.invested)}` }));
    box.append(el(doc, 'p', { text: `Current ${formatInr(c.current)}` }));
    box.append(el(doc, 'p', { text: `Gain ${formatInr(c.gain)} (${pct(c.gainPct)})` }));
    container.append(box);
  }
  if (view.missing.length > 0 && view.sections.length > 0) {
    container.append(el(doc, 'p', { className: 'meta', text: `Not synced: ${view.missing.join(', ')}` }));
  }
}
