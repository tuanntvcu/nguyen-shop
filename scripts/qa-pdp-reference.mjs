import fs from 'node:fs/promises';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const themeId = process.env.SHOPIFY_THEME_ID || '140844204093';
const base = process.env.STOREFRONT_URL || 'https://i9f8uv-gq.myshopify.com';
const url = process.env.NO_THEME_PREVIEW === '1'
  ? `${base}/products/adjustable-bunion-corrector`
  : `${base}/products/adjustable-bunion-corrector?preview_theme_id=${themeId}`;
const allViewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1024', width: 1024, height: 900 },
  { name: 'tablet-768', width: 768, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-375', width: 375, height: 812 },
];
const requestedViewports = (process.env.QA_VIEWPORTS || '').split(',').filter(Boolean);
const viewports = requestedViewports.length ? allViewports.filter(viewport => requestedViewports.includes(viewport.name)) : allViewports;
const browser = await chromium.launch({ headless: true });
const output = [];
await fs.mkdir('tmp/pdp-reference-qa', { recursive: true });

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.addStyleTag({ content: '#preview-bar-iframe, iframe[src*="preview_bar"] { display: none !important; visibility: hidden !important; }' }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
  await page.getByRole('button', { name: 'DECLINE', exact: true }).first().click({ timeout: 2000 }).catch(() => {});
  await page.locator('#preview-bar-iframe, iframe[src*="preview_bar"]').evaluateAll(nodes => nodes.forEach(node => node.remove())).catch(() => {});
  await page.getByText('Cookie consent', { exact: true }).first().evaluate(heading => {
    let overlay = heading;
    while (overlay.parentElement && getComputedStyle(overlay).position !== 'fixed') overlay = overlay.parentElement;
    overlay.style.display = 'none';
  }).catch(() => {});
  await page.waitForTimeout(300);
  const root = page.locator('.altaeron-pdp');
  await root.waitFor({ state: 'visible', timeout: 30000 });
  const metrics = await root.evaluate(node => {
    const rect = selector => {
      const element = node.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
    };
    return {
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      title: node.querySelector('h1')?.getAttribute('aria-label') || node.querySelector('h1')?.textContent.trim(),
      sectionOrder: [...node.children].filter(item => item.matches('section')).map(item => item.className),
      hero: rect('.apdp-hero'), heroGrid: rect('.apdp-hero__grid'), gallery: rect('.apdp-gallery'), narrative: rect('.apdp-narrative'), purchase: rect('.apdp-buy'),
      trust: rect('.apdp-trust-strip'), familiar: rect('.apdp-familiar'), story: rect('.apdp-story'), reviews: rect('.apdp-reviews'), how: rect('.apdp-how'), moments: rect('.apdp-lifestyle'), routine: rect('.apdp-routine'), values: rect('.apdp-values'), faq: rect('.apdp-faq'), compatibility: rect('.apdp-compatibility'), guides: rect('.apdp-guides'), sticky: rect('.apdp-sticky'),
      components: { headline: rect('h1'), trustGrid: rect('.apdp-trust-strip__grid'), familiarCard: rect('.apdp-familiar .apdp-content-card'), reassurance: rect('.apdp-reassurance'), storyMedia: rect('.apdp-story__media'), howMedia: rect('.apdp-how__media'), momentCard: rect('.apdp-lifestyle .apdp-content-card'), routineCard: rect('.apdp-product-card'), valuesPanel: rect('.apdp-values__panel'), disclaimer: rect('.apdp-disclaimer'), faqAccordion: rect('.apdp-accordion'), shoeMedia: rect('.apdp-compatibility .apdp-content-card__media'), guideCard: rect('.apdp-guides .apdp-content-card') },
      cards: { familiar: node.querySelectorAll('.apdp-familiar .apdp-content-card').length, reviews: node.querySelectorAll('.apdp-review').length, steps: node.querySelectorAll('.apdp-steps li').length, moments: node.querySelectorAll('.apdp-lifestyle .apdp-content-card').length, routine: node.querySelectorAll('.apdp-product-card').length, faq: node.querySelectorAll('.apdp-accordion details').length, shoes: node.querySelectorAll('.apdp-compatibility .apdp-content-card').length, guides: node.querySelectorAll('.apdp-guides .apdp-content-card').length },
    };
  });
  // Trigger the production theme's viewport reveal animations before a full-page capture.
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < pageHeight; y += Math.max(500, viewport.height - 100)) {
    await page.evaluate(position => window.scrollTo(0, position), y);
    await page.waitForTimeout(35);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.locator('#preview-bar-iframe, iframe[src*="preview_bar"]').evaluateAll(nodes => nodes.forEach(node => node.remove())).catch(() => {});
  await page.screenshot({ path: `tmp/pdp-reference-qa/${viewport.name}.png`, fullPage: true });
  if (viewport.width <= 390) {
    await page.evaluate(() => window.scrollTo(0, Math.max(900, window.innerHeight * 1.4)));
    await page.waitForTimeout(250);
    await page.locator('#preview-bar-iframe, iframe[src*="preview_bar"]').evaluateAll(nodes => nodes.forEach(node => node.remove())).catch(() => {});
    metrics.stickyAfterHero = await root.locator('.apdp-sticky').evaluate(element => {
      const box = element.getBoundingClientRect();
      const title = element.querySelector('.apdp-sticky__product strong')?.textContent.trim();
      const savings = element.querySelector('[data-apdp-sticky-savings]');
      return { hidden: element.hidden, x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height), title, savings: savings?.hidden ? null : savings?.textContent.trim() };
    });
    await page.screenshot({ path: `tmp/pdp-reference-qa/${viewport.name}-sticky.png` });
    if (viewport.width === 375) {
      const cartRequest = page.waitForRequest(request => request.url().includes('/cart/add'), { timeout: 5000 }).catch(() => null);
      await root.locator('[data-apdp-sticky-submit]').evaluate(button => button.click());
      const request = await cartRequest;
      metrics.stickyAfterHero.nativeCartRequest = Boolean(request);
    }
  }
  output.push({ viewport, status: response?.status(), metrics, consoleErrors, pageErrors });
  await context.close();
}

await browser.close();
await fs.writeFile('tmp/pdp-reference-qa/report.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output.map(item => ({ viewport: item.viewport, status: item.status, title: item.metrics.title, width: item.metrics.document, cards: item.metrics.cards, errors: item.pageErrors.length, consoleErrors: item.consoleErrors.length })), null, 2));
