import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '../tmp/pw/node_modules/playwright/index.mjs';
const dir='tmp/airrelief-audit/architecture';
await fs.mkdir(dir,{recursive:true});
const baseline=process.argv.includes('--baseline');
const browser=await chromium.launch({headless:true});
const results=[];
const shots={atf:'.apdp-hero',story:'.apdp-dialfit-story',mechanism:'.apdp-dialfit-mechanism',uses:'.apdp-dialfit-uses__panel',medical:'.apdp-expert',guarantee:'.apdp-dialfit-guarantee-section',final:'.apdp-final-cta'};
const referenceFingerprint=async page=>page.locator('.altaeron-pdp').evaluate(root=>{
 const selectors=['.apdp-narrative h1','.apdp-gallery__stage','.apdp-buy','.apdp-dialfit-story','.apdp-dialfit-mechanism','.apdp-dialfit-benefits','.apdp-dialfit-use-card','.apdp-expert__panel','.apdp-tail-faq','.apdp-final-cta'];
 const props=['fontFamily','fontSize','fontWeight','lineHeight','color','backgroundColor','padding','borderRadius','gap','gridTemplateColumns'];
 return {images:[...root.querySelectorAll('img')].filter(e=>!e.closest('.jdgm-widget')).map(e=>e.getAttribute('src')),headings:[...root.querySelectorAll('.alta-pdp-section-heading__title')].map(e=>e.textContent.trim()),components:selectors.map(selector=>{const el=root.querySelector(selector),style=getComputedStyle(el),rect=el.getBoundingClientRect();return {selector,width:rect.width,height:rect.height,styles:Object.fromEntries(props.map(p=>[p,style[p]]))};})};
});
try{
 for(const width of [375,768,1440]){
  for(const handle of baseline?['dialfit-knee-brace']:['dialfit-knee-brace','airrelief-foot-ankle-massager']){
   const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push({message:e.message,stack:e.stack}));
   const response=await page.goto(`https://altaeron.com/products/${handle}`,{waitUntil:'domcontentloaded'});
   await page.locator('.altaeron-pdp').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1400);
   assert.equal(response.status(),200);
   if(handle==='dialfit-knee-brace'){
    const signature=await referenceFingerprint(page);
    if(baseline)await fs.writeFile(`${dir}/dialfit-${width}-before.json`,JSON.stringify(signature,null,2));
    else {const expected=JSON.parse(await fs.readFile(`${dir}/dialfit-${width}-before.json`,'utf8'));expected.images=expected.images.filter(src=>!src?.includes('review-images.judgeme.com'));assert.deepEqual(signature,expected,`DialFit appearance at ${width}`);}
    await fs.writeFile(`${dir}/dialfit-${width}-${baseline?'before':'after'}.json`,JSON.stringify(signature,null,2));
   }
   const data=await page.locator('.altaeron-pdp').evaluate(root=>{
    const price=root.querySelector('[data-apdp-current-price]'),compare=root.querySelector('[data-apdp-compare-price]');
    const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
    const section5=[...root.children].find(e=>e.querySelector('.apdp-massager-compare'));
    return {overflow:document.documentElement.scrollWidth>innerWidth,liquidError:root.textContent.includes('Liquid error'),missingTranslation:root.textContent.includes('translation missing'),sections:[...root.children].filter(e=>e.tagName==='SECTION').length,numbers:[...root.querySelectorAll('.alta-pdp-section-heading__number')].map(e=>e.textContent.trim()),headings:[...root.querySelectorAll('.alta-pdp-section-heading__title')].map(e=>e.textContent.trim()),faqCount:root.querySelectorAll('.apdp-tail-faq>.apdp-tail-accordion:not(.apdp-massager-support) details').length,quantity:root.querySelector('[name=quantity]')?.value,price:price.textContent.trim(),compare:compare.textContent.trim(),compareVisible:!compare.hidden&&getComputedStyle(compare).display!=='none',priceRect:rect(price),compareRect:rect(compare),chips:[...root.querySelectorAll('.apdp-dialfit-mechanism__labels span')].map(e=>e.textContent.trim()),useBackgrounds:root.querySelectorAll('.apdp-dialfit-use-card__art').length,comparisonImages:section5?.querySelectorAll('img').length,storyCallout:root.querySelector('.apdp-dialfit-story__copy>p:last-child')?.classList.contains('apdp-dialfit-highlight'),shieldIcons:root.querySelectorAll('.apdp-dialfit-guarantee svg,.apdp-final-badge svg').length,guaranteeSeals:root.querySelectorAll('.apdp-dialfit-seal').length,medicalCriteria:root.querySelectorAll('.apdp-expert__criteria li').length,pendingReview:root.querySelector('.apdp-expert')?.textContent.includes('review pending'),bundles:root.querySelectorAll('bundle-deals-widget,[data-apdp-bundle-widget],.apdp-bundle').length,bundleCopy:/Buy More Save More/i.test(root.textContent),campaign:!!root.querySelector('[data-apdp-promotion-seconds]'),offer:!!root.querySelector('.apdp-new-customer-offer'),videos:root.querySelectorAll('video').length};
   });
   if(handle==='airrelief-foot-ankle-massager'){
    for(const key of ['overflow','liquidError','missingTranslation','bundleCopy','pendingReview'])assert.equal(data[key],false,key);
    assert.equal(data.sections,12);assert.deepEqual(data.numbers,['1','2','3','4','5','6','7','8','9']);
    assert.equal(data.faqCount,13);assert.equal(data.quantity,'1');assert.equal(data.compareVisible,true);assert.ok(Math.abs(data.priceRect.y-data.compareRect.y)<30);
    assert.deepEqual(data.chips,['3 COMPRESSION CYCLES','5 INTENSITY LEVELS','4 HEAT LEVELS','4 VIBRATION LEVELS']);
    assert.equal(data.useBackgrounds,4);assert.equal(data.comparisonImages,1);assert.equal(data.storyCallout,true);assert.equal(data.shieldIcons,0);assert.equal(data.guaranteeSeals,2);assert.equal(data.medicalCriteria,3);assert.equal(data.bundles,0);assert.equal(data.campaign,true);assert.equal(data.offer,true);assert.equal(data.videos,2);
    assert.ok(await page.locator('.apdp-expert blockquote p').evaluate(e=>e.getBoundingClientRect().width)>150,'Medical copy occupies the full text column');
    assert.equal(await page.locator('.apdp-expert__portrait img').count(),1,'Medical panel has a real media area');
    assert.notEqual(await page.locator('.apdp-massager-guarantee-badge').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','Guarantee badge has contrast');
   }
   if(errors.length)await fs.writeFile(`${dir}/runtime-errors.json`,JSON.stringify({width,handle,errors},null,2));
   assert.deepEqual(errors,[],`${handle} JS errors`);
   await page.addStyleTag({content:'.apdp-sticky,[is="sticky-header"]{visibility:hidden!important}'});
   for(const [name,selector] of Object.entries(shots)){
    if(handle==='dialfit-knee-brace'&&!['atf','uses','medical','final'].includes(name))continue;
    const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();await page.waitForTimeout(200);
    await el.screenshot({path:`${dir}/${handle}-${width}-${name}-${baseline?'before':'after'}.png`});
   }
   const broken=await page.locator('.altaeron-pdp img').evaluateAll(images=>images.filter(e=>e.complete&&e.naturalWidth===0).map(e=>e.src));assert.deepEqual(broken,[]);
   results.push({width,handle,data,errors,brokenImages:broken});console.log(JSON.stringify({width,handle,pass:true,sections:data.sections,compareVisible:data.compareVisible}));
   await context.close();
  }
 }
 await fs.writeFile(`${dir}/${baseline?'baseline':'visual-qa'}.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}
