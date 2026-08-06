import fs from 'node:fs/promises';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const data = JSON.parse(await fs.readFile(process.env.PRODUCT_MEDIA_AUDIT || 'tmp/pdp-audit/store-inventory.json', 'utf8'));
const products = data.products.nodes;
const cards = products.flatMap((product) => product.media.nodes.map((media, index) => ({
  product: product.title,
  index: index + 1,
  url: media.preview?.image?.url,
}))).filter((item) => item.url);
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:20px;background:#eee;font:14px Arial}.group{margin-bottom:30px}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.card{background:white;border:1px solid #bbb}.card img{display:block;width:100%;aspect-ratio:1;object-fit:contain}.label{padding:8px;font-size:12px;line-height:1.25}.group h2{margin:0 0 10px}
</style>${products.map((product) => `<section class="group"><h2>${product.title}</h2><div class="grid">${cards.filter((card) => card.product === product.title).map((card) => `<div class="card"><img src="${card.url}"><div class="label">#${card.index}</div></div>`).join('')}</div></section>`).join('')}`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await fs.mkdir('tmp/media-audit', { recursive: true });
await page.screenshot({ path: 'tmp/media-audit/product-media.png', fullPage: true });
await browser.close();
