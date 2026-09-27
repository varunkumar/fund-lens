// Parses display amounts such as "₹9,99,999.50", "-₹99.9" or "(1,234.50)".
// Returns null when the text is not a plain amount, so callers can fail loudly.
export function parseAmount(text) {
  if (typeof text !== 'string') return null;
  let s = text.replace(/[₹\s,]/g, '');
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith('-')) {
    negative = !negative;
    s = s.slice(1);
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return negative ? -n : n;
}
