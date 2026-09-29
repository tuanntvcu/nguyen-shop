import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const themeId = process.env.SHOPIFY_THEME_ID || '141868073021';
const base = process.env.STOREFRONT_URL || 'https://altaeron.myshopify.com';
const url = `${base}/products/adjustable-bunion-corrector?preview_theme_id=${themeId}&view=altaeron-reels-v4`;
const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
];

const browser = await chromium.launch({ headless: true });
const results = [];
await fs.mkdir('tmp/reels-v4-qa', { recursive: true });

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.locator('.altaeron-pdp--reels-v4').waitFor({ state: 'visible', timeout: 30000 });

  const metrics = await page.locator('.altaeron-pdp--reels-v4').evaluate((root) => {
    const rect = (selector) => {
      const node = root.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { top: box.top + scrollY, width: box.width, height: box.height };
    };
    const gallery = rect('.apdp-gallery');
    const galleryViewer = rect('.apdp-gallery__viewer');
    const narrative = rect('.apdp-narrative');
    const buy = rect('.apdp-buy');
    const mechanism = rect('.v4-video--portrait');
    const proof = rect('.altaeron-customer-proof');
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      gallery,
      galleryViewer,
      narrative,
      buy,
      mechanism,
      proof,
      proofCards: root.querySelectorAll('.altaeron-customer-proof__review').length,
      proofAvatars: root.querySelectorAll('.altaeron-customer-proof__avatar img').length,
      proofButton: Boolean(root.querySelector('.altaeron-customer-proof__button')),
      proofSummary: root.querySelector('.altaeron-customer-proof__summary')?.textContent.trim(),
      proofText: [...root.querySelectorAll('.altaeron-customer-proof__quote')].map((node) => node.textContent.trim()),
      tryImage: Boolean(root.querySelector('.v4-try__media img')),
      chooseBundlePresent: root.textContent.includes('Choose Your Bundle'),
    };
  });
  console.log(viewport.name, JSON.stringify(metrics));

  assert.equal(response?.status(), 200, `${viewport.name}: response status`);
  assert.ok(metrics.overflow <= 1, `${viewport.name}: horizontal overflow ${metrics.overflow}px`);
  assert.equal(metrics.proofCards, 2, `${viewport.name}: customer proof cards`);
  assert.equal(metrics.proofAvatars, 2, `${viewport.name}: customer avatars`);
  assert.equal(metrics.proofButton, false, `${viewport.name}: no proof button`);
  assert.ok(metrics.proofSummary?.includes('from') && metrics.proofSummary?.includes('reviews'), `${viewport.name}: dynamic proof summary`);
  assert.ok(metrics.proofText[0]?.startsWith('my right bunion has been bugging me forever'), `${viewport.name}: Linda full review`);
  assert.ok(metrics.proofText[1]?.startsWith('I really like this brace.'), `${viewport.name}: debbie full review`);
  assert.equal(metrics.tryImage, true, `${viewport.name}: Easy to Try image`);
  assert.equal(metrics.chooseBundlePresent, false, `${viewport.name}: removed bundle heading`);
  assert.ok(Math.abs(metrics.galleryViewer.width / metrics.galleryViewer.height - 1) < 0.03, `${viewport.name}: square gallery`);
  assert.ok(Math.abs(metrics.mechanism.width / metrics.mechanism.height - 9 / 16) < 0.03, `${viewport.name}: 9:16 mechanism video`);
  if (viewport.width < 768) {
    assert.ok(metrics.gallery.top < metrics.narrative.top && metrics.narrative.top < metrics.buy.top, `${viewport.name}: gallery-first ATF order`);
  }
  assert.equal(pageErrors.length, 0, `${viewport.name}: page errors ${pageErrors.join('; ')}`);

  await page.screenshot({ path: `tmp/reels-v4-qa/${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, metrics, pageErrors });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
