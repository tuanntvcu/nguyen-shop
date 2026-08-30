import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const layout = await fs.readFile('layout/theme.liquid', 'utf8');
const marker = layout.indexOf('// This must run');
const scriptStart = layout.lastIndexOf('<script>', marker);
const scriptEnd = layout.indexOf('</script>', marker);

assert.ok(marker > -1 && scriptStart > -1 && scriptEnd > scriptStart, 'localized checkout compatibility script exists');
assert.ok(
  scriptStart > layout.indexOf('{{ content_for_layout }}'),
  'compatibility script runs after Shopify renders the bundle app config',
);

const source = layout.slice(scriptStart + '<script>'.length, scriptEnd);
const cases = [
  ['/', '/checkout'],
  ['/fr', '/fr/checkout'],
  ['/de', '/de/checkout'],
  ['/pt-BR', '/pt-BR/checkout'],
];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const [root, expectedCheckout] of cases) {
  const script = source.replace('{{ routes.root_url | json }}', JSON.stringify(root));
  await page.setContent(`
    <script type="application/json" id="bundle-deals-global-config">{"routes":{"root":"${root}"}}</script>
    <script>${script}<\/script>
  `);
  const normalizedRoot = await page.evaluate(() => (
    JSON.parse(document.getElementById('bundle-deals-global-config').textContent).routes.root
  ));
  assert.equal(`${normalizedRoot}checkout`, expectedCheckout, `${root}: localized checkout URL`);
}

await browser.close();
console.log(JSON.stringify(Object.fromEntries(cases), null, 2));
