import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const themeId = process.env.SHOPIFY_THEME_ID || '140844204093';
const base = process.env.STOREFRONT_URL || 'https://i9f8uv-gq.myshopify.com';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await context.newPage();
const requests = [];
const responses = [];
page.on('request', (request) => { if (request.url().includes('/cart/add')) requests.push({ method: request.method(), url: request.url() }); });
page.on('response', async (response) => { if (response.url().includes('/cart/add')) responses.push({ status: response.status(), url: response.url(), body: await response.text().catch(() => '') }); });
await page.goto(`${base}/products/adjustable-bunion-corrector?preview_theme_id=${themeId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('.altaeron-pdp').waitFor({ state: 'visible', timeout: 30000 });
await page.evaluate(() => { window.__apdpSubmitEvents = 0; document.querySelector('.apdp-form')?.addEventListener('submit', () => { window.__apdpSubmitEvents += 1; }); });
await page.locator('.apdp-how').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const sticky = page.locator('[data-apdp-sticky-submit]');
const visible = await sticky.isVisible();
await sticky.evaluate((button) => button.click());
await page.waitForTimeout(3000);
const state = await page.evaluate(async () => ({
  submitEvents: window.__apdpSubmitEvents,
  stickyHidden: document.querySelector('[data-apdp-sticky]').hidden,
  stickyDisabled: document.querySelector('[data-apdp-sticky-submit]').disabled,
  mainDisabled: document.querySelector('[data-apdp-submit]').disabled,
  mainAriaDisabled: document.querySelector('[data-apdp-submit]').getAttribute('aria-disabled'),
  formError: document.querySelector('.product-form__error-message')?.textContent.trim(),
  cart: await fetch('/cart.js').then((response) => response.json()),
}));
console.log(JSON.stringify({ visible, requests, responses, state: { ...state, cart: { item_count: state.cart.item_count, items: state.cart.items.map((item) => item.handle) } } }, null, 2));
await browser.close();
