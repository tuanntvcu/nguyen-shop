import fs from 'node:fs/promises';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const themeId = process.env.SHOPIFY_THEME_ID || '140844204093';
const base = process.env.STOREFRONT_URL || 'https://i9f8uv-gq.myshopify.com';
const handles = [
  'adjustable-bunion-corrector', 'ankle-support-side-stabilizers', 'breathable-bunion-support',
  'day-night-bunion-corrector', 'electric-foot-hand-massager', 'plantar-fasciitis-night-splint-sock',
  'rotating-toe-alignment-support',
];
const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 375, height: 812 }];
const browser = await chromium.launch({ headless: true });
const results = [];
await fs.mkdir('tmp/pdp-qa', { recursive: true });

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  for (const handle of handles) {
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const url = `${base}/products/${handle}?preview_theme_id=${themeId}`;
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    const declineCookies = page.getByRole('button', { name: 'DECLINE', exact: true });
    if (await declineCookies.count()) await declineCookies.first().click({ timeout: 3000 }).catch(() => {});
    const consentHeading = page.getByText('Cookie consent', { exact: true });
    if (await consentHeading.count()) {
      await consentHeading.first().evaluate((heading) => {
        let overlay = heading;
        while (overlay.parentElement && getComputedStyle(overlay).position !== 'fixed') overlay = overlay.parentElement;
        if (getComputedStyle(overlay).position === 'fixed') overlay.style.display = 'none';
      }).catch(() => {});
    }
    const hidePreviewBar = page.getByRole('button', { name: 'Hide bar', exact: true });
    if (await hidePreviewBar.count()) await hidePreviewBar.first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(200);
    const root = page.locator('.altaeron-pdp');
    const visible = await root.isVisible().catch(() => false);
    const metrics = visible ? await root.evaluate((node) => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      title: node.querySelector('h1')?.textContent.trim(),
      media: node.querySelectorAll('[data-apdp-media]').length,
      variantControls: node.querySelectorAll('[data-apdp-variant-option], [data-apdp-variant-select]').length,
      reviewCards: node.querySelectorAll('.apdp-review').length,
      faqItems: node.querySelectorAll('.apdp-accordion details').length,
      sections: node.querySelectorAll(':scope > section').length,
    })) : null;

    let variantSwitch = { attempted: false };
    if (visible) {
      const select = root.locator('[data-apdp-variant-select]');
      const radios = root.locator('[data-apdp-variant-option]');
      const priceBefore = await root.locator('[data-apdp-current-price]').textContent();
      if (await select.count()) {
        const options = await select.locator('option').count();
        if (options > 1) {
          const second = await select.locator('option').nth(1).getAttribute('value');
          await select.selectOption(second);
          await page.waitForTimeout(150);
          variantSwitch = { attempted: true, urlUpdated: page.url().includes(`variant=${second}`), priceBefore, priceAfter: await root.locator('[data-apdp-current-price]').textContent() };
        }
      } else if (await radios.count() > 1) {
        const second = radios.nth(1);
        const secondId = await second.getAttribute('value');
        await second.evaluate((input) => {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(150);
        variantSwitch = { attempted: true, urlUpdated: page.url().includes(`variant=${secondId}`), priceBefore, priceAfter: await root.locator('[data-apdp-current-price]').textContent() };
      }
    }

    if (visible && handle === 'adjustable-bunion-corrector') {
      await page.screenshot({ path: `tmp/pdp-qa/${handle}-${viewport.name}.png`, fullPage: true });
    } else if (visible) {
      await page.screenshot({ path: `tmp/pdp-qa/${handle}-${viewport.name}-hero.png`, fullPage: false });
    }
    results.push({ viewport: viewport.name, handle, status: response?.status(), visible, metrics, variantSwitch, consoleErrors, pageErrors });
    await page.close();
  }
  await context.close();
}

// Exercise the native product form in an isolated browser context and verify the cart endpoint.
const cartContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
const cartPage = await cartContext.newPage();
await cartPage.goto(`${base}/products/adjustable-bunion-corrector?preview_theme_id=${themeId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await cartPage.locator('.altaeron-pdp').waitFor({ state: 'visible', timeout: 30000 });
const cartDecline = cartPage.getByRole('button', { name: 'DECLINE', exact: true });
if (await cartDecline.count()) await cartDecline.first().click({ timeout: 3000 }).catch(() => {});
await cartPage.locator('.apdp-how').scrollIntoViewIfNeeded();
await cartPage.waitForTimeout(300);
const stickyButton = cartPage.locator('.altaeron-pdp [data-apdp-sticky-submit]');
const stickyVisible = await stickyButton.isVisible();
await stickyButton.evaluate((button) => button.click());
await cartPage.waitForTimeout(3000);
const cart = await cartPage.evaluate(async () => fetch('/cart.js').then((response) => response.json()));
const cartTest = { stickyVisible, itemCount: cart.item_count, containsProduct: cart.items.some((item) => item.handle === 'adjustable-bunion-corrector') };
await cartContext.close();

await browser.close();
const report = { generatedAt: new Date().toISOString(), themeId, results, cartTest };
await fs.writeFile('tmp/pdp-qa/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  pages: results.length,
  visible: results.filter((result) => result.visible).length,
  overflowFailures: results.filter((result) => result.metrics && result.metrics.scrollWidth > result.metrics.clientWidth + 1).map((result) => `${result.handle}/${result.viewport}`),
  pageErrors: results.flatMap((result) => result.pageErrors.map((error) => `${result.handle}/${result.viewport}: ${error}`)),
  consoleErrorCount: results.reduce((sum, result) => sum + result.consoleErrors.length, 0),
  variantFailures: results.filter((result) => result.variantSwitch.attempted && !result.variantSwitch.urlUpdated).map((result) => `${result.handle}/${result.viewport}`),
  cartTest,
}, null, 2));
