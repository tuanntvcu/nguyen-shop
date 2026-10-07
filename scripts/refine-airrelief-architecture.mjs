import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='tmp/airrelief-audit/architecture';
const original=await fs.readFile(`${dir}/sections__altaeron-pdp-massager.liquid`,'utf8');
const parts=[...original.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
assert.equal(parts.length,18,'Build from the saved pre-architecture implementation.');
const icon=name=>`{% render 'altaeron-pdp-icon', icon: '${name}' %}`;
const heading=part=>part.match(/\{% render 'altaeron-pdp-section-heading',[\s\S]*?%\}/)[0];
const title=part=>heading(part).match(/title: '([\s\S]*?)'/)[1];
const paras=part=>[...part.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);
const insertEnd=(part,body)=>part.replace(/<\/div><\/section>$/,`${body}</div></section>`);
const detail=(label,body)=>`<div class="apdp-tail-accordion apdp-massager-support"><details><summary>${label}{% render 'icon-accordion-chevron', class: 'apdp-tail-accordion__chevron' %}</summary><div class="apdp-massager-support__body">${body}</div></details></div>`;
const seal=`<div class="apdp-dialfit-seal" role="img" aria-label="30-Day Comfort Guarantee"><strong>30-DAY</strong><span>COMFORT</span>GUARANTEE</div>`;
const next=[...parts];
// Use the original DialFit purchase-price wrapper and dynamic price hooks.
next[0]=parts[0].replace(/<div class="apdp-price">[\s\S]*?<\/div>/,`<div class="apdp-buy__price-line"><div><div class="apdp-price" aria-live="polite"><span class="apdp-price__current" data-apdp-current-price>{{ current_variant.price | money }}</span><s class="apdp-price__compare" data-apdp-compare-price{% if current_compare <= current_variant.price %} hidden{% endif %}>{{ current_compare | money }}</s></div></div><span class="apdp-price__save" data-apdp-savings hidden></span></div>`);
next[1]=parts[1].replace('<p class="apdp-dialfit-highlight">Strap it on. Sit back. Let your feet finally switch off.</p>','<p class="apdp-dialfit-highlight"><strong>Heavy after a long day?</strong><br>Give them 15 minutes of compression, warmth and vibration.<br>Strap it on. Sit back. Let your feet finally switch off.</p>');
const controls=parts[6].match(/<div class="apdp-dialfit-benefits">[\s\S]*?<\/div>/)[0];
const chips=`<div class="apdp-dialfit-mechanism__labels" aria-label="AirRelief configuration"><span>3 COMPRESSION CYCLES</span><span>5 INTENSITY LEVELS</span><span>4 HEAT LEVELS</span><span>4 VIBRATION LEVELS</span></div>`;
// Tags stay beneath the detail media even when no media is configured.
next[2]=parts[2].replace('<div class="apdp-dialfit-support-states">',`${paras(parts[6])[0]}<div class="apdp-dialfit-support-states">`);
next[2]=next[2].replace('{% if section.settings.mechanism_image != blank %}<div class="apdp-dialfit-mechanism__visual">','<div class="apdp-dialfit-mechanism__visual">{% if section.settings.mechanism_image != blank %}');
next[2]=next[2].replace('</div></div>{% endif %}</div></div></section>',`</div>{% endif %}</div></div>${chips}</div></section>`);
assert.ok(next[2].includes(chips));
// Reuse the real DialFit background art and overlay composition; picker overrides come later.
const useAssets=['dialfit-use-shifts.webp','dialfit-use-walking.webp','dialfit-use-training.webp','dialfit-use-travel.webp'];
let useIndex=0;
next[4]=parts[4].replace(/<article class="apdp-dialfit-use-card">[\s\S]*?<\/article>/g,card=>{
 const index=++useIndex;
 const art=`{% assign use_image = section.settings.use_image_${index} %}{% if use_image != blank %}{{ use_image | image_url: width: 960 | image_tag: class: 'apdp-dialfit-use-card__art', loading: 'lazy', widths: '480, 720, 960', sizes: '(min-width: 768px) 45vw, 100vw', alt: '' }}{% else %}<img class="apdp-dialfit-use-card__art" src="{{ '${useAssets[index-1]}' | asset_url }}" width="960" height="640" loading="lazy" alt="">{% endif %}`;
 return card.replace('</article>',`${art}</article>`);
});
assert.equal(useIndex,4);
const supportLabels=['Feet feel heavy by evening','Ankles feel stiff after sitting','Feet feel overworked after walking','You want warmth after a long day'];
next[4]=insertEnd(next[4],`<div class="apdp-dialfit-audience-strip"><h3><span>${icon('heart')}</span>Also useful when...</h3><ul>${supportLabels.map((label,n)=>`<li>${icon(['standing','stairs','walk','bag'][n])}<span>${label}</span></li>`).join('')}</ul>${paras(parts[11]).join('')}</div>`);
// One responsive supporting image outside the horizontally scrolling comparison table.
next[5]=parts[5].replace(/<div class="apdp-dialfit-compare__media-row"[\s\S]*?<\/div>(?=<\/div><\/div><p)/,'');
const compareImage=`{% if section.settings.comparison_image_1 != blank %}<figure class="apdp-dialfit-compare__media apdp-massager-comparison-media">{{ section.settings.comparison_image_1 | image_url: width: 1200 | image_tag: loading: 'lazy', widths: '360, 720, 960, 1200', sizes: '(min-width: 768px) 60vw, 100vw', alt: section.settings.comparison_image_1.alt | default: product.title }}</figure>{% endif %}`;
next[5]=next[5].replace('<p class="apdp-dialfit-highlight">',`${compareImage}<p class="apdp-dialfit-highlight">`);
assert.ok(!next[5].includes('comparison_image_2'));
// Fold controls, session progression, battery, fit and proof media into chapter 6.
next[7]=parts[7].replace("number: '7'","number: '6'");
const progression=parts[8].match(/<ol\b[\s\S]*?<\/ol>/)[0];
const proof=parts[8].slice(parts[8].indexOf('<div class="apdp-dialfit-proof">'),parts[8].lastIndexOf('</div></section>'));
const batteryFit=`<div class="apdp-dialfit-benefits apdp-massager-practical">${[9,10].map(i=>`<article><h3>${title(parts[i])}</h3>${paras(parts[i]).join('')}</article>`).join('')}</div>`;
next[7]=insertEnd(next[7],`${batteryFit}${detail(title(parts[6]),controls)}${detail(title(parts[8]),`${progression}${paras(parts[8]).at(-1)}`)}${proof}`);
// Keep the actual reviewer identity gated by verified permission. Match the complete composition
// with honest product information when no independent reviewer has been verified.
next[12]=`<section id="AltaeronMedicalReview-{{ section.id }}" tabindex="-1" class="apdp-expert alta-pdp-flow-section apdp-dialfit-section"><div class="apdp-shell">
{% render 'altaeron-pdp-section-heading', number: '7', title: 'Medical Review', subtitle: 'Massage methods, adjustable comfort and everyday use.' %}
<div class="apdp-expert__panel">
<div class="apdp-expert__portrait">{% if section.settings.reviewer_verified and section.settings.reviewer_portrait != blank %}{{ section.settings.reviewer_portrait | image_url: width: 1024 | image_tag: loading: 'lazy', widths: '320, 480, 720, 1024', sizes: '(min-width: 768px) 18vw, 35vw', alt: section.settings.reviewer_name }}{% else %}{% assign medical_image = section.settings.medical_image | default: section.settings.mechanism_image | default: hero_image %}{% if medical_image != blank %}{{ medical_image | image_url: width: 1024 | image_tag: loading: 'lazy', widths: '320, 480, 720, 1024', sizes: '(min-width: 768px) 18vw, 35vw', alt: medical_image.alt | default: product.title }}{% endif %}{% endif %}</div>
<div class="apdp-expert__profile">{% if section.settings.reviewer_verified and section.settings.reviewer_name != blank %}<small>Reviewed by</small><h2>{{ section.settings.reviewer_name | escape }}</h2><p>{{ section.settings.reviewer_credentials | escape }}</p>{% else %}<small>Product design &amp; everyday comfort</small><h2>Compression · Warmth · Vibration</h2><p>Foot &amp; ankle coverage</p><strong>Adjustable pressure, heat and vibration</strong><span class="apdp-expert__signature">Altaeron™ AirRelief</span>{% endif %}</div>
<blockquote><span aria-hidden="true">{% if section.settings.reviewer_verified and section.settings.reviewer_name != blank %}“{% endif %}</span><p>{{ section.settings.medical_body | escape }}{% if section.settings.reviewer_verified and section.settings.reviewer_name != blank %}<b aria-hidden="true">”</b>{% endif %}</p></blockquote>
<div class="apdp-expert__criteria"><strong>Designed around everyday comfort</strong><ul><li>${icon('check')} Compression around the foot and ankle</li><li>${icon('check')} Adjustable heat and vibration</li><li>${icon('check')} A cordless, approximately 15-minute routine</li></ul>${paras(parts[12]).filter(p=>!p.includes('review pending')&&!p.includes('medical_body')&&!p.includes('reviewer_credentials')).join('')}</div>
<div class="apdp-expert__press apdp-massager-methods" aria-label="Massage methods"><span>COMPRESSION</span><span>WARMTH</span><span>VIBRATION</span></div>
</div></div></section>`;
next[14]=parts[14].replace("number: '14'","number: '8'");
const specsBody=parts[13].slice(parts[13].indexOf('<div class="apdp-dialfit-compare'),parts[13].lastIndexOf('</div></section>'));
next[14]=next[14].replace('</section>',`${detail('Product Specifications &amp; In the Box',specsBody)}</section>`);
next[15]=parts[15].replace(icon('shield'),`<div class="apdp-massager-guarantee-badge">${seal}</div>`);
next[17]=parts[17].replace(`<div class="apdp-final-badge" aria-hidden="true"><div class="apdp-dialfit-seal">${icon('shield')}</div></div>`,`<div class="apdp-final-badge">${seal}</div>`);
next[16]=parts[16].replace('<h2>AirRelief Customer Reviews</h2>',`{% render 'altaeron-pdp-section-heading', number: '9', title: 'AirRelief Customer Reviews' %}`).replace('class="apdp-shell apdp-review-summary"','class="apdp-tail apdp-shell apdp-dialfit-full alta-pdp-flow-section apdp-dialfit-section apdp-review-summary"');
const order=[0,1,2,3,4,5,7,12,14,15,17,16];
let result=original.slice(0,original.indexOf(parts[0]))+order.map(i=>next[i]).join('\n\n')+original.slice(original.indexOf(parts.at(-1))+parts.at(-1).length);
// Keep the mobile sticky purchase bar's explicit label and dynamic sale price pair.
result=result.replace('<span>Altaeron™ AirRelief <b data-apdp-sticky-price>{{ current_variant.price | money }}</b></span>','<span>Altaeron™ AirRelief<small><b data-apdp-sticky-price>{{ current_variant.price | money }}</b> <s data-apdp-sticky-compare{% if current_compare <= current_variant.price %} hidden{% endif %}>{{ current_compare | money }}</s></small></span>');
result=result.replace('<span data-apdp-sticky-text>{{ cta_label | escape }}</span>','<span data-apdp-sticky-text data-available-text="Add to cart">{% if current_variant.available %}Add to cart{% else %}{{ \'products.product.sold_out\' | t | escape }}{% endif %}</span>');
// Schema adds media overrides without changing existing settings or temporary media selections.
const schemaMatch=result.match(/\{% schema %\}\s*([\s\S]*?)\s*\{% endschema %\}/);
const schema=JSON.parse(schemaMatch[1]);
schema.settings.push({type:'header',content:'Use case background images'},...[1,2,3,4].map(i=>({type:'image_picker',id:`use_image_${i}`,label:['Standing','Walking and travel','Training','Evening wind-down'][i-1]+' background'})));
schema.settings.push({type:'image_picker',id:'medical_image',label:'Medical panel product image'});
result=result.replace(schemaMatch[1],JSON.stringify(schema,null,2)+'\n');
result=result.replace('#AltaeronPdp-{{ section.id }} .apdp-massager-compare>.apdp-dialfit-compare__media-row{grid-template-columns:1fr 1fr}\n','');
result=result.replace('#AltaeronPdp-{{ section.id }} .apdp-dialfit-use-card:not(:has(.apdp-dialfit-use-card__art)):after{display:none}\n','');
assert.equal([...result.matchAll(/<section\b/g)].length,12);
assert.equal(result.match(/title: 'Frequently Asked Questions'/g).length,1);
assert.ok(!result.includes("icon: 'shield'"));
// Preserve all FAQ topics and answers, dynamic purchase/campaign code and full specifications.
assert.ok(result.includes(parts[14].match(/<div class="apdp-tail-accordion">[\s\S]*?<\/div>/)[0]));
assert.ok(result.includes(specsBody));
for(const marker of ['altaeron-labor-day-promotion','altaeron_pdp_offer.new_customer_html','name="quantity" value="1"','data-apdp-final-submit','data-apdp-compare-price'])assert.ok(result.includes(marker),marker);
await fs.writeFile('sections/altaeron-pdp-massager.liquid',result.replace(/\r\n/g,'\n').replace(/[ \t]+$/gm,''));
let css=await fs.readFile(`${dir}/assets__altaeron-pdp-massager.css`,'utf8');
css=css.split(/\r?\n/).filter(line=>!line.includes('neutral-portrait')&&!line.includes('.apdp-final-badge svg')).join('\n');
css+=`\n/* Product-specific supporting content uses existing DialFit components. */
.altaeron-pdp--massager .apdp-massager-comparison-media{border-radius:16px;margin:24px auto 0;max-width:720px}
.altaeron-pdp--massager .apdp-massager-support{margin-top:24px}
.altaeron-pdp--massager .apdp-massager-support__body{padding:0 0 24px}
.altaeron-pdp--massager .apdp-massager-support__body .apdp-dialfit-steps{margin-top:24px}
.altaeron-pdp--massager .apdp-dialfit-proof{margin-top:34px}
.altaeron-pdp--massager .apdp-massager-methods>span{font-size:14px;letter-spacing:.04em}
.altaeron-pdp--massager .apdp-massager-guarantee-badge{background:var(--altaeron-primary,#006B5E);border-radius:50%;margin:auto;width:108px}
.altaeron-pdp--massager .apdp-dialfit-benefits.apdp-massager-practical{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:34px}
@media(max-width:767px){
 .altaeron-pdp--massager .apdp-dialfit-benefits.apdp-massager-practical{grid-template-columns:1fr}
}
`;
await fs.writeFile('assets/altaeron-pdp-massager.css',css.replace(/[ \t]+$/gm,''));
console.log('Refined 18 sections to 12 containers: 8 numbered chapters, guarantee, final CTA and conditional chapter-9 reviews.');
await import('./refine-airrelief-copy.mjs');
