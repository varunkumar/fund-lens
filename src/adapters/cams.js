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

// One app-scheme-tile holds one .scheme_box per fund; a tile without boxes counts as a single card.
function fundCards(root) {
  return [...root.querySelectorAll('app-scheme-tile')].flatMap((tile) => {
    const boxes = [...tile.querySelectorAll('.scheme_box')];
    return boxes.length ? boxes : [tile];
  });
}

function scrapeTiles(root) {
  return fundCards(root).map((tile) => {
    const fundName = clean(tile.querySelector('.scheme_title .title'));
    const invested = parseAmount(valueByLabel(tile, 'invested') ?? '');
    const current = parseAmount(valueByLabel(tile, 'current') ?? '');
    if (!fundName) throw new AdapterError('myCAMS: scheme name not found (layout changed?)');
    if (invested === null || current === null) throw new AdapterError(`myCAMS: could not read amount for "${fundName}"`);
    return { fundName, invested, current };
  });
}

export async function scrapeCams(doc, { waitSettle = defaultWaitSettle } = {}) {
  const count = doc.querySelectorAll('.swiperAMCwiseListing .swiper-slide').length;
  if (count === 0) throw new AdapterError('myCAMS: AMC tabs not found. Open the dashboard AMC list first.');

  const root = doc.querySelector('.main_cont') ?? doc.body;
  // Re-query on every use: the router may re-render the swiper and orphan stored nodes.
  const slideAt = (i) => doc.querySelectorAll('.swiperAMCwiseListing .swiper-slide')[i];
  const isChecked = (input) => !!input && (input.checked || input.hasAttribute('checked'));
  const labelOf = (slide, i) => clean(slide?.querySelector('label')) || `AMC #${i + 1}`;
  const click = (slide) => {
    const label = slide.querySelector('label');
    const input = slide.querySelector('input');
    (label ?? input).click();
    if (label && input && !isChecked(input)) input.click();
  };
  const originalIndex = Math.max(0, [...doc.querySelectorAll('.swiperAMCwiseListing .swiper-slide')].findIndex((s) => isChecked(s.querySelector('input'))));

  const rows = [];
  const failed = [];
  let timedOut = 0;
  let prevSig = null;
  try {
    for (let i = 0; i < count; i++) {
      const slide = slideAt(i);
      if (!slide) {
        failed.push(`AMC #${i + 1}`);
        continue;
      }
      const settling = waitSettle(root); // start observing before the click
      click(slide);
      if ((await settling) === 'timeout') {
        failed.push(labelOf(slide, i));
        timedOut++;
        continue;
      }
      const tiles = scrapeTiles(root);
      const sig = tiles.map((t) => t.fundName).join('\u0000');
      // Empty, or identical to the previous tab's tiles: the render had not happened yet.
      if (tiles.length === 0 || (prevSig !== null && sig === prevSig)) {
        failed.push(labelOf(slide, i));
        continue;
      }
      prevSig = sig;
      rows.push(...tiles);
    }
  } finally {
    // Put the page back on the tab the user had selected, without masking an earlier error.
    try {
      const restoring = waitSettle(root);
      const original = slideAt(originalIndex);
      if (original) click(original);
      await restoring;
    } catch {
      /* best effort */
    }
  }

  if (rows.length === 0 && timedOut === 0) throw new AdapterError('myCAMS: no holdings found on the page');
  if (rows.length === 0) throw new AdapterError(`myCAMS: no AMC tab finished loading (${failed.join(', ')})`);
  return { rows, partial: failed.length > 0, failed };
}
