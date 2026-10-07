import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '../tmp/pw/node_modules/playwright/index.mjs';
const browser=await chromium.launch({headless:true});const results=[];
const source=await fs.readFile('assets/altaeron-pdp-massager.js','utf8');
try{
 for(const [label,compare,available] of [['sale',6995,true],['regular',4995,true],['unavailable',6995,false]]){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const variant={id:43777320845373,price:4995,compare_at_price:compare,available};
  await page.setContent(`<div class="altaeron-pdp--massager" data-add-to-cart-label="GET MY AIRRELIEF" data-sold-out-label="Sold out"><form class="apdp-form"><input data-apdp-variant-id name="id" value="43777320845373"><input name="quantity" value="1"><button data-apdp-submit><span data-apdp-submit-label data-available-text="GET MY AIRRELIEF"></span><b data-apdp-cta-price></b></button></form><span data-apdp-current-price></span><s data-apdp-compare-price></s><strong data-apdp-final-price></strong><s data-apdp-final-compare></s><button data-apdp-final-submit><span data-apdp-final-button-price></span></button><script type="application/json" data-apdp-product-json>${JSON.stringify([variant])}</script></div>`);
  await page.addScriptTag({content:source});
  assert.deepEqual(errors,[]);
  assert.equal(await page.locator('[data-apdp-compare-price]').evaluate(e=>e.hidden),compare<=4995);
  assert.equal(await page.locator('[data-apdp-final-compare]').evaluate(e=>e.hidden),compare<=4995);
  assert.equal(await page.locator('[data-apdp-current-price]').innerText(),'$49.95');
  assert.equal(await page.locator('[data-apdp-final-price]').innerText(),'$49.95');
  assert.equal(await page.locator('[data-apdp-submit]').isDisabled(),!available);
  assert.equal(await page.locator('[data-apdp-final-submit]').isDisabled(),!available);
  results.push({label,compareVisible:compare>4995,purchaseEnabled:available,pass:true});await page.close();
 }
 await fs.writeFile('tmp/airrelief-audit/architecture/price-qa.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
