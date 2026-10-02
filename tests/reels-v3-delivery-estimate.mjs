import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const script = await fs.readFile('assets/altaeron-pdp.js', 'utf8');
const section = await fs.readFile('sections/altaeron-pdp-reels-v3.liquid', 'utf8');
const addBusinessDaysSource = script.match(/function addBusinessDays\([\s\S]*?\n  \}/)?.[0];

assert.ok(addBusinessDaysSource, 'addBusinessDays must remain a reusable function');
const addBusinessDays = new Function(`${addBusinessDaysSource}; return addBusinessDays;`)();
const formatEnglishRange = (orderDate, start, end) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  ...(orderDate.getFullYear() !== end.getFullYear() || start.getFullYear() !== end.getFullYear()
    ? { year: 'numeric' }
    : {}),
}).formatRange(start, end).replace(/\s*[–-]\s*/u, '–');
const deliveryRange = (dateString) => {
  const orderDate = new Date(`${dateString}T12:00:00`);
  const handlingBusinessDays = 1;
  const minTransitBusinessDays = 3;
  const maxTransitBusinessDays = 4;
  const processingCompleteDate = addBusinessDays(orderDate, handlingBusinessDays);
  return formatEnglishRange(
    orderDate,
    addBusinessDays(processingCompleteDate, minTransitBusinessDays),
    addBusinessDays(processingCompleteDate, maxTransitBusinessDays),
  );
};

assert.equal(deliveryRange('2026-10-02'), 'Oct 8–9', 'Friday must include handling before transit');
assert.equal(deliveryRange('2026-10-05'), 'Oct 9–12', 'Monday must include handling before transit');
assert.equal(deliveryRange('2026-10-03'), 'Oct 8–9', 'Saturday must start handling on Monday');
assert.equal(deliveryRange('2026-10-04'), 'Oct 8–9', 'Sunday must start handling on Monday');
assert.equal(deliveryRange('2026-10-27'), 'Nov 2–3', 'month-end range must remain natural');
assert.equal(deliveryRange('2026-12-28'), 'Jan 1–4, 2027', 'cross-year calculation must remain natural');

const deliveryStyles = section
  .match(/<style>([\s\S]*?)<\/style>/)[1]
  .split('\n')
  .filter((line) => line.includes('.apdp-delivery-estimate'))
  .join('\n')
  .replaceAll('{{ section.id }}', 'Test');
const browser = await chromium.launch({ headless: true });

for (const width of [375, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.setContent(`<!doctype html><html lang="en"><head><style>${deliveryStyles}</style></head><body>
    <div id="AltaeronPdp-Test" class="altaeron-pdp">
      <form>
        <button data-apdp-submit>START YOUR CORRECTION — $24.95</button>
        <p class="apdp-delivery-estimate" data-apdp-delivery-estimate data-locale="en"><svg aria-hidden="true"></svg><span>Estimated delivery: <strong data-apdp-delivery-range></strong></span></p>
        <p class="apdp-cta-reassurance">Secure checkout · Free &amp; Tracked Shipping · 30-Day Easy Returns</p>
      </form>
    </div>
  </body></html>`);
  await page.addScriptTag({ path: path.resolve('assets/altaeron-pdp.js') });

  const result = await page.evaluate(() => {
    const estimate = document.querySelector('[data-apdp-delivery-estimate]');
    return {
      range: document.querySelector('[data-apdp-delivery-range]').textContent,
      previousIsCta: estimate.previousElementSibling.matches('[data-apdp-submit]'),
      nextIsTrustRow: estimate.nextElementSibling.matches('.apdp-cta-reassurance'),
      textAlign: getComputedStyle(estimate).textAlign,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

  assert.ok(result.range, `${width}px delivery range must initialize`);
  assert.equal(result.previousIsCta, true, `${width}px estimate must follow the CTA`);
  assert.equal(result.nextIsTrustRow, true, `${width}px estimate must precede the trust row`);
  assert.equal(result.textAlign, 'center', `${width}px estimate must remain centered`);
  assert.equal(result.overflow, false, `${width}px estimate must not cause horizontal overflow`);
  assert.deepEqual(consoleErrors, [], `${width}px page must not log console errors`);
  await page.close();
}

await browser.close();
console.log('Reel V3 delivery estimate tests passed');
