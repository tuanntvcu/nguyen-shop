import {chromium} from '../tmp/pw/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='tmp/airrelief-audit/architecture';
const browser=await chromium.launch({headless:true});const results=[];const diagnostics=[];
try{
 const context=await browser.newContext({viewport:{width:375,height:950}});const page=await context.newPage();
 page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='log')diagnostics.push({type:msg.type(),message:msg.text().slice(0,800)});});
 page.on('response',response=>{if(response.status()>=400)diagnostics.push({status:response.status(),url:response.url().split('?')[0]});});
 const initial=await page.goto('https://altaeron.com/products/airrelief-foot-ankle-massager',{waitUntil:'domcontentloaded'});assert.equal(initial.status(),200);
 await page.waitForFunction(()=>document.querySelector('.altaeron-pdp--massager')?.dataset.apdpReady==='true'&&customElements.get('product-form'));
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:950});await page.waitForTimeout(500);
  await page.locator('.apdp-tail-accordion details').evaluateAll(items=>items.forEach(e=>e.open=false));
  const faq=page.locator('.apdp-tail-faq>.apdp-tail-accordion:not(.apdp-massager-support) details').first();await faq.locator('summary').click();assert.equal(await faq.getAttribute('open'),'');
  const specs=page.locator('.apdp-tail-faq .apdp-massager-support details');await specs.locator('summary').click();assert.equal(await specs.getAttribute('open'),'');assert.equal(await specs.locator('[role=row]').count(),12);
  await specs.locator('summary').click();
  const controls=page.locator('.apdp-massager-support details').filter({hasText:'Your Massage. Your Intensity.'});await controls.locator('summary').click();assert.equal(await controls.getAttribute('open'),'');
  const comparison=page.locator('.apdp-massager-comparison-scroll');const scroll=await comparison.evaluate(e=>{e.scrollLeft=150;return{client:e.clientWidth,scrollWidth:e.scrollWidth,left:e.scrollLeft,overflow:document.documentElement.scrollWidth>innerWidth};});assert.equal(scroll.overflow,false);if(width===375)assert.ok(scroll.left>0);
  const timer=page.locator('[data-apdp-promotion-seconds]');const t=await timer.innerText();await page.waitForFunction(value=>document.querySelector('.altaeron-pdp--massager [data-apdp-promotion-seconds]')?.textContent!==value,t,{timeout:7000});
  for(const selector of ['[data-apdp-submit]','[data-apdp-final-submit]']){
   const cleared=await page.evaluate(async()=>{document.querySelector('cart-drawer')?.hide();const response=await fetch('/cart/clear.js',{method:'POST'});return {status:response.status,retryAfter:response.headers.get('Retry-After')};});
   assert.equal(cleared.status,200,`Cart clear response; Retry-After: ${cleared.retryAfter}`);
   await page.waitForFunction(()=>!document.querySelector('[data-apdp-submit]').disabled&&document.querySelector('[data-apdp-submit]').getAttribute('aria-disabled')!=='true'&&!document.querySelector('[data-apdp-final-submit]').disabled);
   console.log(`Testing ${selector} at ${width}px`);
   await page.locator(selector).click();await page.waitForFunction(()=>document.querySelector('cart-drawer')?.open===true);
   const cart=await page.evaluate(async()=>await(await fetch('/cart.js')).json());assert.equal(cart.items.length,1);assert.equal(cart.items[0].product_id,8052528480317);assert.equal(cart.items[0].quantity,1);
  }
  await page.evaluate(async()=>{document.querySelector('cart-drawer')?.hide();await fetch('/cart/clear.js',{method:'POST'});});
  results.push({width,faqOpens:true,specsOpen:true,controlsOpen:true,comparisonScroll:scroll,countdownTicks:true,mainCtaAddsOne:true,finalCtaAddsOne:true,cartDrawerOpens:true});
  console.log(JSON.stringify(results.at(-1)));
 }
 await context.close();
 await fs.writeFile(`${dir}/interactions-qa.json`,JSON.stringify({results},null,2));
 console.log('Live purchase interactions passed; no checkout/order. Sale/regular/unavailable states are checked separately by qa-airrelief-price.mjs.');
}catch(error){await fs.writeFile(`${dir}/interaction-errors.json`,JSON.stringify({error:error.message,results,diagnostics},null,2));console.log(JSON.stringify({diagnostics}));throw error;}finally{await browser.close();}
