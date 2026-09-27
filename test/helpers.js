import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

export function loadFixture(name) {
  const html = readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
  return parseHTML(html).document;
}
