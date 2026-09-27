import { parseAmount } from '../core/parse.js';
import { AdapterError } from './errors.js';

const clean = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
const directRows = (table) =>
  [...table.children].flatMap((c) => (c.tagName === 'TR' ? [c] : [...c.children].filter((r) => r.tagName === 'TR')));
const directCells = (tr) => [...tr.children].filter((c) => c.tagName === 'TD' || c.tagName === 'TH');

function columnIndex(headers, label) {
  const i = headers.findIndex((h) => h.toLowerCase().includes(label));
  if (i < 0) throw new AdapterError(`KFintech: column "${label}" not found (layout changed?)`);
  return i;
}

function scrapeTable(table) {
  const rows = directRows(table);
  const headerRow = rows.find((r) => [...r.children].some((c) => c.tagName === 'TH'));
  if (!headerRow) throw new AdapterError('KFintech: header row not found (layout changed?)');
  const headers = directCells(headerRow).map(clean);
  const nameCol = columnIndex(headers, 'scheme');
  const costCol = columnIndex(headers, 'cost value');
  const currentCol = columnIndex(headers, 'current value');
  const needed = Math.max(nameCol, costCol, currentCol);

  const out = [];
  for (const tr of rows) {
    if (tr === headerRow) continue;
    const cells = directCells(tr);
    if (cells.length <= needed) {
      // Only detail rows (wrapping a nested table) may be skipped.
      if (cells.some((c) => c.querySelector('table'))) continue;
      throw new AdapterError(`KFintech: unreadable row "${clean(tr).slice(0, 60)}" (layout changed?)`);
    }
    const fundName = clean(cells[nameCol]);
    if (!fundName || /^total\b/i.test(fundName)) continue;
    const invested = parseAmount(clean(cells[costCol]));
    const current = parseAmount(clean(cells[currentCol]));
    if (invested === null || current === null) {
      throw new AdapterError(`KFintech: could not read amount for "${fundName}"`);
    }
    out.push({ fundName, invested, current });
  }
  return out;
}

export function scrapeKfintech(doc) {
  const tables = [...doc.querySelectorAll('table.kfin-portfolio-table')];
  if (tables.length === 0) throw new AdapterError('KFintech: portfolio table not found. Open the portfolio page first.');
  const out = tables.flatMap(scrapeTable);
  if (out.length === 0) throw new AdapterError('KFintech: no holdings found on the page');
  return { rows: out, partial: false, failed: [] };
}
