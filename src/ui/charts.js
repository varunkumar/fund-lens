import { allocation, bySource, investedVsCurrent, gainPerFund } from '../core/chart-data.js';
import { formatInr } from './render.js';

const NS = 'http://www.w3.org/2000/svg';
// Colour-blind-safe categorical palette; series are also told apart by legend text, never colour alone.
const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#db2777', '#64748b'];

function svg(doc, tag, attrs = {}, text) {
  const n = doc.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text !== undefined) n.textContent = text;
  return n;
}
function html(doc, tag, className, text) {
  const n = doc.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}
const short = (s, n = 28) => (s.length > n ? `${s.slice(0, n - 1)}...` : s);

function card(doc, title, sub) {
  const c = html(doc, 'section', 'chart');
  c.append(html(doc, 'h3', '', title));
  if (sub) c.append(html(doc, 'p', 'meta', sub));
  return c;
}

function donut(doc, title, slices, sub) {
  const c = card(doc, title, sub);
  if (slices.length === 0) return c;
  const R = 60, r = 38, C = 2 * Math.PI * ((R + r) / 2), w = R - r;
  const chart = svg(doc, 'svg', { viewBox: '0 0 160 160', class: 'donut', role: 'img', 'aria-label': title });
  let offset = 0;
  slices.forEach((s, i) => {
    const len = (s.pct / 100) * C;
    chart.append(svg(doc, 'circle', {
      cx: 80, cy: 80, r: (R + r) / 2, fill: 'none', stroke: PALETTE[i % PALETTE.length], 'stroke-width': w,
      'stroke-dasharray': `${len} ${C - len}`, 'stroke-dashoffset': -offset, transform: 'rotate(-90 80 80)',
    }));
    offset += len;
  });
  const wrap = html(doc, 'div', 'donut-wrap');
  wrap.append(chart);
  const legend = html(doc, 'ul', 'legend');
  slices.forEach((s, i) => {
    const li = html(doc, 'li');
    const sw = html(doc, 'span', 'swatch');
    sw.style.background = PALETTE[i % PALETTE.length];
    li.append(sw, html(doc, 'span', 'lbl', `${short(s.label)}`), html(doc, 'span', 'val', `${s.pct.toFixed(1)}% (${formatInr(s.value)})`));
    legend.append(li);
  });
  wrap.append(legend);
  c.append(wrap);
  return c;
}

const ROW = 26, LABEL_W = 190, BAR_W = 260;

function barRows(doc, title, rows, series, fmt, sub) {
  const c = card(doc, title, sub);
  if (rows.length === 0) return c;
  const max = Math.max(...rows.flatMap((r) => series.map((s) => Math.abs(r[s.key]))), 1);
  const h = rows.length * ROW * series.length + 8;
  const chart = svg(doc, 'svg', { viewBox: `0 0 ${LABEL_W + BAR_W + 90} ${h}`, class: 'bars', role: 'img', 'aria-label': title });
  rows.forEach((r, i) => {
    const y0 = i * ROW * series.length + 4;
    chart.append(svg(doc, 'text', { x: 0, y: y0 + 14, class: 'axis' }, short(r.label, 30)));
    series.forEach((s, j) => {
      const v = r[s.key];
      const len = Math.max(1, (Math.abs(v) / max) * BAR_W);
      const y = y0 + j * (ROW - 6);
      chart.append(svg(doc, 'rect', { x: LABEL_W, y, width: len, height: ROW - 10, rx: 3, fill: s.color(v) }));
      chart.append(svg(doc, 'text', { x: LABEL_W + len + 6, y: y + 11, class: 'axis' }, fmt(v)));
    });
  });
  c.append(chart);
  if (series.length > 1) {
    const legend = html(doc, 'ul', 'legend inline');
    for (const s of series) {
      const li = html(doc, 'li');
      const sw = html(doc, 'span', 'swatch');
      sw.style.background = s.color(1);
      li.append(sw, html(doc, 'span', 'lbl', s.name));
      legend.append(li);
    }
    c.append(legend);
  }
  return c;
}

export function renderCharts(doc, container, view) {
  container.replaceChildren();
  if (view.sections.length === 0) return;
  const grid = html(doc, 'div', 'charts');
  grid.append(donut(doc, 'Allocation by fund', allocation(view), 'Share of current value'));
  if (view.sections.length > 1) grid.append(donut(doc, 'Split by source', bySource(view), 'myCAMS vs KFintech'));
  grid.append(barRows(doc, 'Invested vs current', investedVsCurrent(view), [
    { key: 'invested', name: 'Invested', color: () => '#94a3b8' },
    { key: 'current', name: 'Current', color: () => '#2563eb' },
  ], formatInr, 'Top holdings by current value'));
  grid.append(barRows(doc, 'Gain by fund', gainPerFund(view), [
    { key: 'pct', name: 'Gain %', color: (v) => (v >= 0 ? '#16a34a' : '#dc2626') },
  ], (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, 'Best to worst, as % of invested'));
  container.append(grid);
}
