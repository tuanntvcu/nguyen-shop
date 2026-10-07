import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '../tmp/pw/node_modules/playwright/index.mjs';
const dir='tmp/airrelief-audit/design';
const browser=await chromium.launch({headless:true});const results=[];
const selectors={h1:'.apdp-narrative h1',description:'.apdp-narrative__subhead',eyebrow:'.apdp-eyebrow',badge:'.alta-pdp-section-heading__number',story:'.apdp-dialfit-story',storyHeading:'.apdp-dialfit-story h2',accent:'.apdp-dialfit-story h2 strong',storyBody:'.apdp-dialfit-story__copy>p',storyGrid:'.apdp-dialfit-story__layout',storyMedia:'.apdp-dialfit-story__media',mechanismGrid:'.apdp-dialfit-mechanism__layout',mechanismMedia:'.apdp-dialfit-mechanism__media',benefitsGrid:'.apdp-dialfit-benefits',benefitTitle:'.apdp-dialfit-benefits h3',benefitBody:'.apdp-dialfit-benefits p',usesPanel:'.apdp-dialfit-uses__panel',useCardTitle:'.apdp-dialfit-use-card h3',useCardBody:'.apdp-dialfit-use-card p',stepsTitle:'.apdp-dialfit-step h3',stepsBody:'.apdp-dialfit-step p',compare:'.apdp-dialfit-compare',medical:'.apdp-expert__panel',portrait:'.apdp-expert__portrait',medicalProfile:'.apdp-expert__profile',medicalName:'.apdp-expert__profile h2',medicalQuote:'.apdp-expert blockquote p',faq:'.apdp-tail-accordion summary',faqBody:'.apdp-tail-accordion details>p',guarantee:'.apdp-dialfit-guarantee',guaranteeHeading:'.apdp-dialfit-guarantee h2',final:'.apdp-final-cta',finalGrid:'.apdp-final-cta__inner',finalHeading:'.apdp-final-cta h2',finalButton:'.apdp-final-button',button:'[data-apdp-submit]',price:'[data-apdp-current-price]',campaign:'.apdp-promotion'};
const properties=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom','width','borderRadius','gap','gridTemplateColumns','aspectRatio','objectFit','textTransform'];
const shots={atf:'.apdp-hero',story:'.apdp-dialfit-story',mechanism:'.apdp-dialfit-mechanism',benefits:'.altaeron-pdp>section:has(.apdp-dialfit-benefits)',comparison:'.altaeron-pdp>section:has(.apdp-dialfit-compare)',medical:'.apdp-expert',faq:'.apdp-tail-faq',final:'.apdp-final-cta'};
for(const width of [375,768,1024,1440]){
 const contexts=[];const pages=[];const styles=[];
 for(const handle of ['dialfit-knee-brace','airrelief-foot-ankle-massager']){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});contexts.push(context);
  const page=await context.newPage();pages.push(page);const errors=[];page.on('pageerror',e=>errors.push({message:e.message,stack:e.stack}));
  const response=await page.goto(`https://altaeron.com/products/${handle}`,{waitUntil:'domcontentloaded'});await page.locator('.altaeron-pdp').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1400);
  styles.push(await page.evaluate(({selectors,properties})=>Object.fromEntries(Object.entries(selectors).map(([key,selector])=>{const el=document.querySelector(selector);if(!el)return[key,null];const c=getComputedStyle(el);return[key,Object.fromEntries(properties.map(p=>[p,c[p]]))];})),{selectors,properties}));
  const data=await page.locator('.altaeron-pdp').evaluate(root=>({sectionCount:[...root.children].filter(e=>e.tagName==='SECTION').length,overflow:document.documentElement.scrollWidth>innerWidth,liquidError:root.textContent.includes('Liquid error'),missingTranslation:root.textContent.includes('translation missing'),faqCount:root.querySelectorAll('details').length,quantity:root.querySelector('[name=quantity]')?.value,price:root.querySelector('[data-apdp-current-price]')?.textContent,headings:[...root.querySelectorAll('.alta-pdp-section-heading__title')].map(e=>e.textContent.trim()),images:[...root.querySelectorAll('img')].map(e=>e.currentSrc||e.src),videoCount:root.querySelectorAll('video').length,stepCount:root.querySelectorAll('[data-apdp-step-timeline]')[0]?.querySelectorAll('[data-apdp-step]').length,neutralReview:root.querySelector('.apdp-expert')?.textContent.includes('Independent medical review pending. General product information; no clinician endorsement is claimed.')}));
  if(errors.length){console.log(JSON.stringify({width,handle,errors}));await fs.writeFile(`${dir}/runtime-errors.json`,JSON.stringify({width,handle,errors},null,2));}
  if(handle==='airrelief-foot-ankle-massager'){assert.equal(response.status(),200);assert.equal(data.overflow,false);assert.equal(data.liquidError,false);assert.equal(data.missingTranslation,false);assert.equal(data.sectionCount,18);assert.equal(data.quantity,'1');assert.equal(data.faqCount,13);assert.equal(data.stepCount,3);assert.equal(data.videoCount,2);assert.equal(data.neutralReview,true);assert.equal(errors.length,0);}
  results.push({width,handle,data,errors});
  if(!process.env.QA_DESIGN_DIMENSIONS_ONLY&&(width===375||width===768||width===1440)){await page.addStyleTag({content:'.apdp-sticky,[is="sticky-header"]{visibility:hidden!important}'});for(const[key,selector]of Object.entries(shots)){
   const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();await page.waitForTimeout(250);await el.screenshot({path:`${dir}/${handle}-${width}-${key}.png`});
  }}
 }
 const diffs=[];
 for(const [key,ref]of Object.entries(styles[0]))if(ref&&styles[1][key])for(const p of properties){
  if(key==='compare'&&['gridTemplateColumns','width'].includes(p))continue;
  if(ref[p]!==styles[1][key][p])diffs.push({component:key,property:p,dialfit:ref[p],airrelief:styles[1][key][p]});
 }
 results.push({width,computedStyleDifferences:diffs});
 for(const context of contexts)await context.close();
 console.log(JSON.stringify({width,differences:diffs}));
}
await fs.writeFile(`${dir}/visual-qa.json`,JSON.stringify(results,null,2));await browser.close();
