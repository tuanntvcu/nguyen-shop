import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '../tmp/pw/node_modules/playwright/index.mjs';
const browser=await chromium.launch({headless:true});const reports=[];
for(const width of [375,768,1440]){
 const page=await browser.newPage({viewport:{width,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://altaeron.com/products/airrelief-foot-ankle-massager',{waitUntil:'domcontentloaded'});
 const root=page.locator('.altaeron-pdp--massager');await root.waitFor();
 await page.waitForTimeout(1800);
 for(const selector of ['.airrelief-two:has(img)','.airrelief-preview-comparison','.airrelief-preview-proof','.apdp-final-cta']){
  const locator=root.locator(selector);for(let i=0;i<await locator.count();i++){await locator.nth(i).scrollIntoViewIfNeeded();await page.waitForTimeout(300);}
 }
 await page.waitForFunction(()=>[...document.querySelectorAll('.altaeron-pdp--massager img')].every(i=>i.complete&&i.naturalWidth>0),{},{timeout:20000});
 const report=await root.evaluate(el=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,images:[...el.querySelectorAll('img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0})),videos:[...el.querySelectorAll('video')].map(v=>({src:v.currentSrc,readyState:v.readyState,error:v.error?.message,controls:v.controls})),story:!!el.querySelector('.airrelief-two img'),comparisonImages:el.querySelectorAll('.airrelief-preview-comparison img').length,sessionImages:el.querySelectorAll('.airrelief-preview-proof .apdp-massager-proof__image img').length,sessionVideos:el.querySelectorAll('.airrelief-preview-proof video').length,finalImages:el.querySelectorAll('.apdp-final-cta img').length,heroVideos:el.querySelectorAll('.apdp-gallery__stage video').length,liquidErrors:el.textContent.includes('Liquid error')}));
 assert.equal(report.overflow,false);assert.equal(report.liquidErrors,false);assert.equal(report.comparisonImages,2);assert.equal(report.sessionImages,4);assert.equal(report.sessionVideos,1);assert.equal(report.heroVideos,1);assert.equal(report.finalImages,1);assert.equal(errors.length,0);assert.ok(report.videos.every(v=>v.readyState>=2&&!v.error));
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);await page.screenshot({path:`tmp/airrelief-audit/preview-media-hero-${width}.png`});
 await root.locator('.airrelief-preview-proof').screenshot({path:`tmp/airrelief-audit/preview-media-session-${width}.png`});
 reports.push({...report,errors});await page.close();
}
await browser.close();await fs.writeFile('tmp/airrelief-audit/preview-media-qa.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports.map(({images,...r})=>({...r,imageCount:images.length})),null,2));
