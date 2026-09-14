import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const section = await fs.readFile('sections/altaeron-pdp-reels-v3.liquid', 'utf8');
const stylesheet = await fs.readFile('assets/altaeron-pdp.css', 'utf8');
const template = JSON.parse((await fs.readFile('templates/product.altaeron-reels-v3.json', 'utf8')).replace(/^\/\*[\s\S]*?\*\//, ''));

assert.match(section, /data-apdp-submit-label[\s\S]*data-apdp-cta-price/);
assert.match(stylesheet, /\.altaeron-pdp--reels-v3 bundle-deals-widget \[data-tier-index="1"\] \.bd-tier__compare\{display:none!important\}/);
assert.equal(template.sections.altaeron_pdp_reels_v3.settings.cta_label, 'ADD TO CART');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setContent(`<!doctype html><html><body>
  <div class="altaeron-pdp altaeron-pdp--reels-v3" data-product-url="/products/test"
    data-money-format="{{ amount }}" data-save-label="Save"
    data-save-template="Save [amount]" data-add-to-cart-label="ADD TO CART"
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
      <button data-apdp-submit><span data-apdp-submit-label data-available-text="ADD TO CART">ADD TO CART</span><span data-apdp-cta-price> — $24.95</span></button>
    </form>
    <script type="application/json" data-apdp-product-json>[{"id":1,"price":2495,"compare_at_price":3995,"available":true}]</script>
  </div>
</body></html>`);
await page.addScriptTag({ path: path.resolve('assets/altaeron-pdp.js') });
await page.waitForTimeout(100);

const ctaText = () => page.locator('[data-apdp-submit]').innerText();
assert.equal((await ctaText()).trim(), 'ADD TO CART — $24.95');
assert.equal((await page.locator('[data-tier-index="1"] .bd-tier__compare').innerText()).trim(), '$49.90');

await page.locator('[data-tier-index="1"] input').check();
await page.waitForTimeout(100);
assert.equal((await ctaText()).trim(), 'ADD TO CART — $37.44');

await browser.close();
console.log('Reel V3 CTA pricing passed: $24.95 → $37.44');
