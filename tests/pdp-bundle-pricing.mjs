import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const localeFiles = ['es.json', 'fr.json', 'ja.json', 'de.json', 'pt-PT.json'];
const readLocale = async (file) => JSON.parse((await fs.readFile(`locales/${file}`, 'utf8')).replace(/^\/\*[\s\S]*?\*\//, ''));
const escapeAttribute = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');

const browser = await chromium.launch({ headless: true });
const results = [];

for (const file of localeFiles) {
  const locale = await readLocale(file);
  const language = file.replace('.json', '');
  const bundle = locale.altaeron_pdp.bundle;
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.setContent(`<!doctype html><html lang="${language}"><head></head><body>
    <div class="altaeron-pdp" data-product-url="/products/test" data-money-format="{{ amount }}"
      data-save-label="${escapeAttribute(locale.altaeron_pdp.common.save)}"
      data-save-template="${escapeAttribute(locale.altaeron_pdp.common.save_amount.replace('{{ amount }}', '[amount]'))}"
      data-add-to-cart-label="Add" data-sold-out-label="Sold out"
      data-bundle-title="${escapeAttribute(bundle.title)}"
      data-bundle-one="${escapeAttribute(bundle.one_corrector)}"
      data-bundle-many-template="${escapeAttribute(bundle.many_correctors.replace('{{ count }}', '[count]'))}"
      data-bundle-one-foot="${escapeAttribute(bundle.one_foot)}"
      data-bundle-popular="${escapeAttribute(bundle.most_popular)}"
      data-bundle-best-value="${escapeAttribute(bundle.best_value)}"
      data-bundle-subtitle-template="${escapeAttribute(bundle.only_each_save.replace('{{ price }}', '[price]').replace('{{ percent }}', '[percent]'))}">
      <div class="apdp-buy__price-line"><div><p class="apdp-buy__from">From</p><div class="apdp-price"><span class="apdp-price__current" data-apdp-current-price></span><s class="apdp-price__compare" data-apdp-compare-price></s></div></div><span class="apdp-price__save" data-apdp-savings></span></div>
      <form class="apdp-form"><input data-apdp-variant-id value="1"><button data-apdp-submit><span data-apdp-submit-label data-available-text="Add"></span><b data-apdp-cta-price></b></button>
        <bundle-deals-widget><div class="bd-title">Buy More</div>
          <div class="bd-tier" data-tier-index="0"><input type="radio" name="tier"><span class="bd-tier__name">1 Corrector</span><span class="bd-tier__sub">Start</span><span class="bd-tier__price">$34.95</span></div>
          <div class="bd-tier" data-tier-index="1"><input type="radio" name="tier" checked><span class="bd-tier__name">2 Correctors</span><span class="bd-tier__label">POPULAR</span><span class="bd-tier__sub">Old</span><span class="bd-tier__price">$52.44</span><s class="bd-tier__compare">$69.90</s></div>
          <div class="bd-tier" data-tier-index="2"><input type="radio" name="tier"><span class="bd-tier__name">3 Correctors</span><span class="bd-tier__label">VALUE</span><span class="bd-tier__sub">Old</span><span class="bd-tier__price">$66.06</span><s class="bd-tier__compare">$104.85</s></div>
        </bundle-deals-widget>
      </form>
      <script type="application/json" data-apdp-product-json>[{"id":1,"price":3495,"compare_at_price":5995,"available":true}]</script>
    </div></body></html>`);
  await page.addStyleTag({ path: path.resolve('assets/altaeron-pdp.css') });
  await page.addScriptTag({ path: path.resolve('assets/altaeron-pdp.js') });
  await page.waitForTimeout(100);

  const readState = () => page.evaluate(() => ({
    price: document.querySelector('[data-apdp-current-price]').textContent,
    compare: document.querySelector('[data-apdp-compare-price]').textContent,
    savings: document.querySelector('[data-apdp-savings]').textContent,
    title: document.querySelector('.bd-title').textContent,
    tiers: [...document.querySelectorAll('.bd-tier')].map((tier) => ({
      name: tier.querySelector('.bd-tier__name').textContent,
      subtitle: tier.querySelector('.bd-tier__sub').textContent,
      compare: tier.querySelector('.bd-tier__compare')?.textContent || '',
    })),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    priceX: Math.round(document.querySelector('[data-apdp-current-price]').getBoundingClientRect().x),
    savingsX: Math.round(document.querySelector('[data-apdp-savings]').getBoundingClientRect().x),
    savingsHeight: document.querySelector('[data-apdp-savings]').getBoundingClientRect().height,
    savingsWhiteSpace: getComputedStyle(document.querySelector('[data-apdp-savings]')).whiteSpace,
  }));

  const tier2 = await readState();
  assert.equal(tier2.title, bundle.title, `${file}: bundle heading`);
  assert.match(tier2.compare, /119(?:[.,\s]|$)/, `${file}: 2-unit compare total`);
  assert.match(tier2.savings, /67(?:[.,\s]|$)/, `${file}: 2-unit savings`);
  assert.match(tier2.tiers[1].subtitle, /56\s?%/, `${file}: 2-unit percentage`);
  for (const width of [320, 375, 430]) {
    await page.setViewportSize({ width, height: 812 });
    const layout = await readState();
    assert.equal(layout.overflow, false, `${file}/${width}px: mobile price row overflow`);
    assert.ok(layout.savingsX < layout.priceX, `${file}/${width}px: savings badge remains left of the price`);
    assert.ok(layout.savingsHeight < 30, `${file}/${width}px: savings badge remains compact`);
    assert.equal(layout.savingsWhiteSpace, 'nowrap', `${file}/${width}px: savings badge remains on one line`);
  }

  await page.locator('[data-tier-index="2"] input').evaluate((input) => {
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const tier3 = await readState();
  assert.match(tier3.compare, /179(?:[.,\s]|$)/, `${file}: 3-unit compare total`);
  assert.match(tier3.savings, /113(?:[.,\s]|$)/, `${file}: 3-unit savings`);
  assert.match(tier3.tiers[2].subtitle, /63\s?%/, `${file}: 3-unit percentage`);
  results.push({ file, tier2, tier3 });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results.map(({ file, tier2, tier3 }) => ({
  file,
  tier2: { compare: tier2.compare, savings: tier2.savings, subtitle: tier2.tiers[1].subtitle },
  tier3: { compare: tier3.compare, savings: tier3.savings, subtitle: tier3.tiers[2].subtitle },
})), null, 2));
