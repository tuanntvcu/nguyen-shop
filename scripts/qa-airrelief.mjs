import fs from 'node:fs/promises';
import {chromium} from '../tmp/pw/node_modules/playwright/index.mjs';
const base='https://altaeron.com',url=`${base}/products/airrelief-foot-ankle-massager`;
const browser=await chromium.launch({headless:true});
const reports=[];
for(const width of [375,768,1440]){
 const context=await browser.newContext({viewport:{width,height:950}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForTimeout(2500);
 await page.getByRole('button',{name:'DECLINE',exact:true}).click({timeout:1500}).catch(()=>{});
 const root=page.locator('.altaeron-pdp--massager');
 console.log(JSON.stringify({width,url:page.url(),title:await page.title(),rootCount:await root.count()}));
 await page.screenshot({path:`tmp/airrelief-audit/debug-${width}.png`});
 await root.waitFor({timeout:20000});
 const report=await root.evaluate(el=>({text:el.innerText,overflow:document.documentElement.scrollWidth>innerWidth,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth,brokenImages:[...el.querySelectorAll('img')].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),bundleCount:el.querySelectorAll('bundle-deals-widget').length,quantity:el.querySelector('[name=quantity]')?.value,price:el.querySelector('[data-apdp-current-price]')?.textContent,faqCount:el.querySelectorAll('details').length,cta:el.querySelector('[data-apdp-submit-label]')?.textContent,hero:el.querySelector('.apdp-hero')?.getBoundingClientRect().height,timer:el.querySelector('[data-apdp-promotion-countdown]')?.innerText}));
 const initialTimer=report.timer;await page.waitForTimeout(1100);report.countdownTicks=await root.locator('[data-apdp-promotion-countdown]').innerText()!==initialTimer;
 report.width=width;report.status=response.status();report.errors=errors;report.stale=/dialfit|kneecap|patella|\bknee\b|\bbrace\b|buy more|save more|358/i.test(report.text);report.conflicting=/3 heat|3 vibration/i.test(report.text);report.missingTranslations=/translation missing/i.test(report.text);
 const faq=root.locator('details').first();await faq.locator('summary').click();report.faqOpens=await faq.getAttribute('open')!==null;
 report.seo=await page.title();report.description=await page.locator('meta[name=description]').getAttribute('content');report.canonical=await page.locator('link[rel=canonical]').getAttribute('href');
 report.schema=await page.locator('script[type="application/ld+json"]').allTextContents();
 await page.screenshot({path:`tmp/airrelief-audit/airrelief-${width}.png`,fullPage:true});
 if(width===375){
  await root.locator('[data-apdp-submit]').click();await page.waitForTimeout(2200);
  report.cart=await page.evaluate(async()=>{const r=await fetch('/cart.js');const j=await r.json();return{items:j.items.map(i=>({product_id:i.product_id,variant_id:i.variant_id,quantity:i.quantity,price:i.price})),total:j.total_price};});
  report.drawerVisible=await page.locator('cart-drawer').evaluate(el=>({tag:el.tagName,classes:el.className,text:el.innerText.slice(0,500)})).catch(()=>null);
  // Exercise the final CTA in the same disposable browser session.
  await page.evaluate(async()=>{await fetch('/cart/clear.js',{method:'POST'});document.querySelector('cart-drawer')?.close?.();});
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(2000);
  await root.locator('[data-apdp-final-submit]').click({force:true});await page.waitForTimeout(1800);
  report.finalCart=await page.evaluate(async()=>{const j=await(await fetch('/cart.js')).json();return j.items.map(i=>({product_id:i.product_id,quantity:i.quantity}));});
 }
 delete report.text;reports.push(report);await context.close();
}
const page=await browser.newPage();const old=JSON.parse(await fs.readFile('tmp/airrelief-audit/before.json','utf8')).product.handle;
const redirect=await page.goto(`${base}/products/${old}`,{waitUntil:'domcontentloaded'});
reports.push({redirectStatus:redirect.status(),redirectUrl:page.url()});
await fs.writeFile('tmp/airrelief-audit/qa.json',JSON.stringify(reports,null,2));
console.log(JSON.stringify(reports.map(({schema,...r})=>r),null,2));await browser.close();
