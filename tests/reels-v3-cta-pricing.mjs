import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const section = await fs.readFile('sections/altaeron-pdp-reels-v3.liquid', 'utf8');
const finalSection = await fs.readFile('sections/altaeron-reels-v3-final.liquid', 'utf8');
const stylesheet = await fs.readFile('assets/altaeron-pdp.css', 'utf8');
const template = JSON.parse((await fs.readFile('templates/product.altaeron-reels-v3.json', 'utf8')).replace(/^\/\*[\s\S]*?\*\//, ''));

assert.match(section, /data-apdp-submit-label[\s\S]*data-apdp-cta-price/);
assert.match(stylesheet, /\.altaeron-pdp--reels-v3 bundle-deals-widget \[data-tier-index="1"\] \.bd-tier__compare\{display:none!important\}/);
assert.equal(template.sections.altaeron_pdp_reels_v3.settings.cta_label, 'START YOUR CORRECTION');
assert.equal(template.sections.altaeron_story_cta.settings.cta_label, 'START YOUR CORRECTION');
assert.match(finalSection, /class="altaeron-relief-closing__cta" data-apdp-final-submit/);
assert.doesNotMatch(finalSection, /data-apdp-final-button-price|apdp-final-payments/);

const browser = await chromium.launch({ headless: true });
const scopedStyle = finalSection
  .match(/<style>([\s\S]*?)<\/style>/)[1]
  .replaceAll('{{ section.id }}', 'Test');

for (const width of [360, 375, 390, 430, 768, 1024, 1280, 1440]) {
  const responsivePage = await browser.newPage({ viewport: { width, height: 1000 } });
  await responsivePage.setContent(`<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0}${scopedStyle}</style></head><body>
    <div id="AltaeronV3Final-Test" class="altaeron-pdp">
      <section class="apdp-final-cta altaeron-relief-closing">
        <div class="altaeron-relief-closing__inner">
          <div class="altaeron-relief-closing__media"><svg viewBox="0 0 700 420" aria-hidden="true"></svg></div>
          <div class="altaeron-relief-closing__content">
            <h2 class="altaeron-relief-closing__title"><span>RELIEF IS ONLY</span><span>THE BEGINNING.</span></h2>
            <p class="altaeron-relief-closing__copy"><span>Don't just cushion the bunion.</span><span>Support the toe position behind the pressure.</span></p>
            <ul class="altaeron-relief-closing__benefits"><li class="altaeron-relief-closing__benefit">Guide the toe outward</li><li class="altaeron-relief-closing__benefit">Create more space</li><li class="altaeron-relief-closing__benefit">Ease bunion pressure</li></ul>
            <button class="altaeron-relief-closing__cta">START YOUR CORRECTION</button>
            <div class="altaeron-relief-closing__trust"><div class="altaeron-relief-closing__trust-item"><svg></svg><span>30-Day Comfort Guarantee</span></div><div class="altaeron-relief-closing__trust-item"><svg></svg><span>Free Shipping</span></div><div class="altaeron-relief-closing__trust-item"><svg></svg><span>Real Support</span></div></div>
          </div>
        </div>
      </section>
    </div>
  </body></html>`);
  const layout = await responsivePage.evaluate(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width };
    };
    return {
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      inner: box('.altaeron-relief-closing__inner'),
      media: box('.altaeron-relief-closing__media'),
      content: box('.altaeron-relief-closing__content'),
      title: box('.altaeron-relief-closing__title'),
      copy: box('.altaeron-relief-closing__copy'),
      benefits: box('.altaeron-relief-closing__benefits'),
      cta: box('.altaeron-relief-closing__cta'),
      trust: box('.altaeron-relief-closing__trust'),
      trustItems: [...document.querySelectorAll('.altaeron-relief-closing__trust-item')].map((item) => {
        const rect = item.getBoundingClientRect();
        return { left: rect.left, right: rect.right, textAlign: getComputedStyle(item).textAlign };
      }),
    };
  });
  assert.equal(layout.scrollWidth, layout.viewport, `${width}px layout must not overflow horizontally`);
  if (width < 900) {
    assert.ok(layout.media.bottom <= layout.title.top, `${width}px layout must remain stacked`);
  } else {
    assert.ok(layout.media.right <= layout.content.left, `${width}px image must sit left of content`);
    assert.ok(layout.content.top >= layout.media.top, `${width}px content must align from the top of the image`);
    assert.ok(layout.title.top - layout.media.top >= 40, `${width}px content needs intentional top offset`);
    assert.ok(layout.content.left - layout.media.right >= 64, `${width}px column gap must be at least 64px`);
    assert.ok(layout.content.left - layout.media.right <= 84, `${width}px column gap must not exceed 84px`);
    assert.ok(layout.inner.width <= 1160.5, `${width}px container must remain controlled`);
    assert.ok(Math.abs(layout.title.left - layout.content.left) < 1);
    assert.ok(Math.abs(layout.benefits.left - layout.content.left) < 1);
    assert.ok(Math.abs(layout.cta.left - layout.content.left) < 1);
    if (width === 1440) assert.ok(layout.media.width >= 500 && layout.media.width <= 540);
  }
  assert.ok(layout.title.bottom <= layout.copy.top);
  assert.ok(layout.copy.bottom <= layout.benefits.top);
  assert.ok(layout.benefits.bottom <= layout.cta.top);
  assert.ok(layout.cta.bottom <= layout.trust.top);
  assert.ok(layout.cta.width <= 320.5);
  assert.equal(layout.trustItems.length, 3);
  assert.ok(layout.trustItems[0].right <= layout.trustItems[1].left);
  assert.ok(layout.trustItems[1].right <= layout.trustItems[2].left);
  assert.ok(layout.trustItems.every((item) => item.textAlign === 'center'), `${width}px trust labels must remain centered under their icons`);
  await responsivePage.close();
}

const page = await browser.newPage();

await page.setContent(`<!doctype html><html><body>
  <div class="altaeron-pdp altaeron-pdp--reels-v3" data-product-url="/products/test"
    data-money-format="{{ amount }}" data-save-label="Save"
    data-save-template="Save [amount]" data-add-to-cart-label="START YOUR CORRECTION"
    data-sold-out-label="Sold out">
    <span data-apdp-current-price></span>
    <s data-apdp-compare-price></s>
    <span data-apdp-savings></span>
    <form class="apdp-form">
      <input data-apdp-variant-id value="1">
      <bundle-deals-widget>
        <label class="bd-tier" data-tier-index="0"><input type="radio" name="tier" checked><span class="bd-tier__name">1 Corrector</span><span class="bd-tier__price">$24.95</span></label>
        <label class="bd-tier" data-tier-index="1"><input type="radio" name="tier"><span class="bd-tier__name">2 Correctors</span><span class="bd-tier__price">$37.44</span><s class="bd-tier__compare">$79.90</s></label>
      </bundle-deals-widget>
      <button data-apdp-submit><span data-apdp-submit-label data-available-text="START YOUR CORRECTION">START YOUR CORRECTION</span><span data-apdp-cta-price> — $24.95</span></button>
    </form>
    <script type="application/json" data-apdp-product-json>[{"id":1,"price":2495,"compare_at_price":3995,"available":true}]</script>
  </div>
</body></html>`);
await page.addScriptTag({ path: path.resolve('assets/altaeron-pdp.js') });
await page.waitForTimeout(100);

const ctaText = () => page.locator('[data-apdp-submit]').innerText();
assert.equal((await ctaText()).trim(), 'START YOUR CORRECTION — $24.95');
assert.equal((await page.locator('[data-tier-index="1"] .bd-tier__compare').innerText()).trim(), '$49.90');

await page.locator('[data-tier-index="1"] input').check();
await page.waitForTimeout(100);
assert.equal((await ctaText()).trim(), 'START YOUR CORRECTION — $37.44');

await browser.close();
console.log('Reel V3 CTA pricing passed: $24.95 → $37.44');
