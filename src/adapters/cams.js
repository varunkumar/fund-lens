import { parseAmount } from '../core/parse.js';
import { AdapterError } from './errors.js';
import { waitSettle as defaultWaitSettle } from './wait-settle.js';

const clean = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function valueByLabel(tile, wanted) {
  for (const block of tile.querySelectorAll('.price')) {
    if (clean(block.querySelector('label')).toLowerCase() === wanted) return clean(block.querySelector('span'));
  }
  return null;
}

function scrapeTiles(doc) {
  return [...doc.querySelectorAll('app-scheme-tile')].map((tile) => {
    const fundName = clean(tile.querySelector('.scheme_title .title'));
    const invested = parseAmount(valueByLabel(tile, 'invested') ?? '');
    const current = parseAmount(valueByLabel(tile, 'current') ?? '');
    if (!fundName) throw new AdapterError('myCAMS: scheme name not found (layout changed?)');
    if (invested === null || current === null) throw new AdapterError(`myCAMS: could not read amount for "${fundName}"`);
    return { fundName, invested, current };
  });
}

export async function scrapeCams(doc, { waitSettle = defaultWaitSettle } = {}) {
  const slides = [...doc.querySelectorAll('.swiperAMCwiseListing .swiper-slide')];
  if (slides.length === 0) throw new AdapterError('myCAMS: AMC tabs not found. Open the dashboard AMC list first.');

  const root = doc.querySelector('.main_cont') ?? doc.body;
  const labelOf = (slide, i) => clean(slide.querySelector('label')) || `AMC #${i + 1}`;
  const click = (slide) => (slide.querySelector('label') ?? slide.querySelector('input')).click();
  const originalIndex = Math.max(0, slides.findIndex((s) => s.querySelector('input')?.checked || s.querySelector('input')?.hasAttribute('checked')));

  const rows = [];
  const failed = [];
  for (const [i, slide] of slides.entries()) {
    const settling = waitSettle(root); // start observing before the click
    click(slide);
    if ((await settling) === 'timeout') {
      failed.push(labelOf(slide, i));
      continue;
    }
    rows.push(...scrapeTiles(doc));
  }

  // Put the page back on the tab the user had selected.
  const restoring = waitSettle(root);
  click(slides[originalIndex]);
  await restoring;

  if (rows.length === 0 && failed.length === 0) throw new AdapterError('myCAMS: no holdings found on the page');
  if (rows.length === 0) throw new AdapterError(`myCAMS: no AMC tab finished loading (${failed.join(', ')})`);
  return { rows, partial: failed.length > 0, failed };
}
