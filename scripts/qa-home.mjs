import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';

const url = process.env.QA_URL || 'https://altaeron.com/?preview_theme_id=140844204093';
const widths = [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440, 1920];
const report = { url, generatedAt: new Date().toISOString(), viewports: [], functional: {}, accessibility: {} };
const browser = await chromium.launch({ headless: true });

async function prepare(page) {
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(1800);
  await page.locator('#PBarNextFrameWrapper, #PBarNextFrame').evaluateAll((elements) => elements.forEach((element) => element.remove()));
  const accept = page.getByRole('button', { name: /^accept$/i });
  if (await accept.count()) await accept.first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.locator('#PBarNextFrameWrapper, #PBarNextFrame').evaluateAll((elements) => elements.forEach((element) => element.remove()));
}

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await prepare(page);
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    sections: document.querySelectorAll('altaeron-home section').length,
    navigation: document.querySelectorAll('header a').length,
    imagesWithoutAlt: [...document.querySelectorAll('.altaeron-home img')].filter((image) => !image.hasAttribute('alt')).length,
    unnamedButtons: [...document.querySelectorAll('.altaeron-home button')].filter((button) => !button.getAttribute('aria-label') && !button.textContent.trim()).length,
    resourceCount: performance.getEntriesByType('resource').length,
    domContentLoaded: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || null,
    loadEvent: performance.getEntriesByType('navigation')[0]?.loadEventEnd || null,
  }));
  report.viewports.push({ width, ...metrics, overflow: metrics.scrollWidth > metrics.viewport, consoleErrors });
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await prepare(page);
await page.locator('[data-quiz-step="1"] [data-quiz-choice]').first().click();
await page.locator('[data-quiz-back]').first().click();
const returnedToStepOne = await page.locator('[data-quiz-step="1"]').isVisible();
await page.locator('[data-quiz-step="1"] [data-quiz-choice]').first().click();
await page.locator('[data-quiz-step="2"] [data-quiz-choice]').first().click();
await page.locator('[data-quiz-step="3"] [data-quiz-choice]').first().click();
await page.waitForTimeout(250);
report.functional.quiz = {
  backWorks: returnedToStepOne,
  resultVisible: await page.locator('[data-quiz-result]').isVisible(),
  resultHref: await page.locator('[data-quiz-result-link]').getAttribute('href'),
};
await page.locator('.ah-faq__item summary').first().click();
report.functional.faq = { opens: await page.locator('.ah-faq__item').first().evaluate((element) => element.open) };
const videoButton = page.locator('[data-video-open]').first();
if (await videoButton.count()) {
  await videoButton.click();
  const modal = page.locator('[data-video-modal]');
  report.functional.video = {
    opens: await modal.evaluate((element) => element.open),
    sourceCount: await modal.locator('video source').count(),
    preload: await modal.locator('video').getAttribute('preload'),
  };
  await page.keyboard.press('Escape');
  report.functional.video.closesWithEscape = !(await modal.evaluate((element) => element.open));
}
report.functional.navigation = {
  menuButton: await page.locator('.menu-drawer-button').count() > 0,
  searchButton: await page.locator('.search-drawer-button').count() > 0,
  cartButton: await page.locator('.cart-drawer-button').count() > 0,
};
const menuButton = page.locator('.menu-drawer-button').first();
if (await menuButton.count()) {
  await menuButton.click();
  const drawer = page.locator('#MenuDrawer');
  report.functional.navigation.drawerOpens = await drawer.isVisible();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  report.functional.navigation.drawerClosesWithEscape = !(await drawer.evaluate((element) => element.hasAttribute('open')));
}
report.functional.newsletter = {
  emailInput: await page.locator('.ah-newsletter__form input[type="email"]').count() === 1,
  submitButton: await page.locator('.ah-newsletter__form button[type="submit"]').count() === 1,
};
const quickAdd = page.locator('form[is="product-form"].ah-quick-add').first();
report.functional.quickAdd = { available: await quickAdd.count() > 0, submitted: false };
if (await quickAdd.count()) {
  const productAdded = page.evaluate(() => new Promise((resolve) => {
    document.addEventListener('product-ajax:added', () => resolve(true), { once: true });
    setTimeout(() => resolve(false), 10000);
  }));
  await quickAdd.locator('button[type="submit"]').click();
  report.functional.quickAdd.submitted = await productAdded;
}
report.accessibility = {
  skipLink: await page.locator('.skip-to-content-link').count() === 1,
  h1Count: await page.locator('h1').count(),
  faqUsesDetails: await page.locator('.ah-faq details').count() > 0,
  quizUsesFieldsets: await page.locator('.ah-quiz fieldset').count() === 3,
};
await page.close();
await browser.close();

await fs.mkdir('tmp/homepage-audit', { recursive: true });
await fs.writeFile('tmp/homepage-audit/qa-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
