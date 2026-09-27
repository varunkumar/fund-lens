import { SOURCE_LABELS } from './sources.js';

const HEADER = ['Source', 'Fund Name', 'Invested Amount', 'Current Value'];

function flatRows(view) {
  return view.sections.flatMap((s) => s.rows.map((r) => [SOURCE_LABELS[s.source], r.fundName, r.invested, r.current]));
}

// Tabs and newlines inside a name would break the column layout on paste.
const clean = (v) => String(v).replace(/[\t\r\n]+/g, ' ').trim();
const csvCell = (v) => (/[",\r\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

// Plain numbers (no currency symbol or grouping) so Google Sheets treats them as numbers.
export function toTsv(view) {
  return [HEADER, ...flatRows(view)].map((r) => r.map(clean).join('\t')).join('\n');
}

export function toCsv(view) {
  return [HEADER, ...flatRows(view)].map((r) => r.map(csvCell).join(',')).join('\n');
}
