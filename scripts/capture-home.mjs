import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';

const baseUrl = process.env.CAPTURE_URL || 'http://127.0.0.1:9292';
const outputDir = process.env.CAPTURE_DIR || 'tmp/screenshots';
const widths = (process.env.CAPTURE_WIDTHS || '375,390,768,1024,1440')
  .split(',')
  .map(Number)
  .filter(Boolean);

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(2500);
  await page.locator('#PBarNextFrameWrapper, #PBarNextFrame').evaluateAll((elements) => elements.forEach((element) => element.remove()));
  const acceptButton = page.getByRole('button', { name: /^accept$/i });
  if (await acceptButton.count()) await acceptButton.first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.addStyleTag({ content: '#preview-bar-iframe, .shopify-preview-bar { display: none !important; }' });
  await page.evaluate(async () => {
    const distance = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y < distance; y += 700) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  await page.locator('#PBarNextFrameWrapper, #PBarNextFrame').evaluateAll((elements) => elements.forEach((element) => element.remove()));
  await page.screenshot({ path: `${outputDir}/homepage-${width}.png`, fullPage: true });
  await page.close();
}

await browser.close();
