import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='tmp/airrelief-audit/design';
const original=await fs.readFile(`${dir}/sections__altaeron-pdp-massager.liquid`,'utf8');
const reference=await fs.readFile(`${dir}/sections__altaeron-pdp-dialfit.liquid`,'utf8');
const sections=[...original.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
assert.equal(sections.length,18);
const icon=name=>`{% render 'altaeron-pdp-icon', icon: '${name}' %}`;
const heading=(part,accent)=>{
 let h=part.match(/\{% render 'altaeron-pdp-section-heading',[\s\S]*?%\}/)?.[0];assert.ok(h);
 if(accent)h=h.replace(accent,`<strong>${accent}</strong>`);
 return h;
};
const image=(key,width=1200,widths='480, 720, 960, 1200',sizes='(min-width: 768px) 48vw, 100vw')=>`{{ section.settings.${key} | image_url: width: ${width} | image_tag: loading: 'lazy', widths: '${widths}', sizes: '${sizes}', alt: section.settings.${key}.alt | default: product.title }}`;
const copy=part=>part.match(/<div class="airrelief-copy">([\s\S]*?)<\/div>/)?.[1]||'';
const paragraphs=part=>[...part.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);
const cards=part=>[...part.matchAll(/<article class="apdp-massager-card"><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/article>/g)].map(m=>({title:m[1],body:m[2]}));
const benefits=items=>`<div class="apdp-dialfit-benefits">${items.map(i=>`<article><h3>${i.title}</h3><p>${i.body}</p></article>`).join('\n')}</div>`;
const standard=(body,extra='')=>`<section class="apdp-education alta-pdp-flow-section apdp-dialfit-section ${extra}"><div class="apdp-shell apdp-dialfit-full">${body}</div></section>`;
const timeline=items=>`<ol class="apdp-dialfit-steps apdp-massager-steps-three" data-apdp-step-timeline>${items.map((i,n)=>`<li class="apdp-dialfit-step" data-apdp-step><span class="apdp-dialfit-step__number" aria-hidden="true">${'ABC'[n]}</span><span class="apdp-dialfit-step__connector" aria-hidden="true"></span><div class="apdp-dialfit-step__copy"><h3>${i.title}</h3><p>${i.body}</p></div></li>`).join('\n')}</ol>`;
const replacements=[...sections];
// Use the real media-first story composition, including the headline's selective emphasis.
replacements[1]=`<section class="apdp-dialfit-story alta-pdp-flow-section"><div class="apdp-shell apdp-dialfit-full apdp-dialfit-story__layout">{% if section.settings.story_image != blank %}<div class="apdp-dialfit-story__media apdp-tail-media">${image('story_image',1400,'480, 720, 960, 1200, 1400','(min-width: 768px) 46vw, 100vw')}</div>{% endif %}<div class="apdp-dialfit-story__copy">${heading(sections[1],'15 Minutes Back.')}${copy(sections[1])}</div></div></section>`;
const mechanismParagraphs=paragraphs(sections[2]).slice(-2).join('\n').replace('airrelief-copy','apdp-dialfit-mechanism__secondary');
const therapies=`<div class="apdp-dialfit-support-states">${cards(sections[2]).map(i=>`<div><strong>${i.title}</strong><span>${i.body}</span></div>`).join('\n')}</div>`;
replacements[2]=standard(`<div class="apdp-dialfit-mechanism__layout"><div class="apdp-dialfit-mechanism__copy">${heading(sections[2])}${therapies}${mechanismParagraphs}</div>{% if section.settings.mechanism_image != blank %}<div class="apdp-dialfit-mechanism__visual"><div class="apdp-dialfit-mechanism__media apdp-tail-media">${image('mechanism_image')}</div></div>{% endif %}</div>`,'apdp-dialfit-mechanism');
replacements[3]=standard(`${heading(sections[3])}${benefits(cards(sections[3]))}`);
const uses=cards(sections[4]);assert.equal(uses.length,4);
const useParagraphs=paragraphs(sections[4]);
replacements[4]=`<section class="apdp-education alta-pdp-flow-section apdp-dialfit-section"><div class="apdp-shell apdp-dialfit-full apdp-dialfit-uses__panel">${heading(sections[4])}<div class="apdp-dialfit-copy">${useParagraphs[0]}</div><div class="apdp-dialfit-use-cases">${uses.map((i,n)=>`<article class="apdp-dialfit-use-card"><span class="apdp-dialfit-use-card__icon">${icon(['shift','suitcase','run','heart'][n])}</span><div class="apdp-dialfit-use-card__copy"><h3>${i.title}</h3><p>${i.body}</p></div></article>`).join('\n')}</div>${useParagraphs.at(-1)}</div></section>`;
const table=sections[5].match(/<table>[\s\S]*?<\/table>/)[0];
const headerCells=[...table.match(/<thead>[\s\S]*?<\/thead>/)[0].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map(m=>m[1]);
const rows=[...table.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m=>[...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(c=>c[1]));assert.equal(rows.length,7);
const compareParagraphs=paragraphs(sections[5]);
replacements[5]=`<section class="apdp-tail alta-pdp-flow-section apdp-dialfit-section"><div class="apdp-shell apdp-dialfit-full">${heading(sections[5])}<div class="apdp-dialfit-copy">${compareParagraphs[0]}</div><div class="apdp-massager-comparison-scroll" tabindex="0" role="region" aria-label="Compare massage options; scroll horizontally on small screens"><div class="apdp-dialfit-compare apdp-massager-compare" role="table" aria-label="Foot comfort options"><div class="apdp-dialfit-compare__head" role="row">${headerCells.map(x=>`<span role="columnheader">${x}</span>`).join('')}</div>${rows.map(row=>`<div role="row">${row.map((x,n)=>`<span role="${n===0?'rowheader':'cell'}">${x}</span>`).join('')}</div>`).join('\n')}<div class="apdp-dialfit-compare__media-row" role="row">{% for index in (1..2) %}{% assign image_key = 'comparison_image_' | append: index %}{% assign comparison_image = section.settings[image_key] %}{% if comparison_image != blank %}<figure class="apdp-dialfit-compare__media" role="cell">{{ comparison_image | image_url: width: 1200 | image_tag: loading: 'lazy', widths: '320, 480, 720, 960, 1200', sizes: '(min-width: 768px) 50vw, 50vw', alt: comparison_image.alt | default: product.title }}</figure>{% endif %}{% endfor %}</div></div></div>${compareParagraphs.at(-1).replace('airrelief-copy','apdp-dialfit-highlight')}</div></section>`;
replacements[6]=standard(`${heading(sections[6])}<div class="apdp-dialfit-copy">${paragraphs(sections[6])[0]}</div>${benefits(cards(sections[6]))}`);
replacements[7]=standard(`${heading(sections[7])}${timeline(cards(sections[7]))}${paragraphs(sections[7]).at(-1)}`);
const proof=sections[8].slice(sections[8].indexOf('{% if section.settings.proof_video != blank or section.settings.proof_image_1 != blank %}'),sections[8].lastIndexOf('</div></section>'));
replacements[8]=standard(`${heading(sections[8])}${timeline(cards(sections[8]))}<div class="apdp-dialfit-copy">${paragraphs(sections[8]).filter(p=>p.includes('No appointment.')).join('')}</div><div class="apdp-dialfit-proof">${proof.replaceAll('apdp-massager-proof','apdp-dialfit-proof').replace(' airrelief-preview-proof','')}</div>`);
for(const index of [9,10,11])replacements[index]=standard(`${heading(sections[index])}<div class="apdp-dialfit-copy">${copy(sections[index])}</div>`);
let medical=sections[12];
medical=medical.replace('class="apdp-expert alta-pdp-flow-section"','class="apdp-expert alta-pdp-flow-section apdp-dialfit-section" tabindex="-1"').replace('class="apdp-shell apdp-massager-full"','class="apdp-shell"').replace('apdp-expert__panel airrelief-expert','apdp-expert__panel').replace('class="airrelief-portrait"','class="apdp-expert__portrait apdp-massager-neutral-portrait"').replaceAll('<h3>','<h2>').replaceAll('</h3>','</h2>').replace('<blockquote><p>','<blockquote><span aria-hidden="true">“</span><p>').replace('</p></blockquote>','<b aria-hidden="true">”</b></p></blockquote>');
replacements[12]=medical;
const specsTable=sections[13].match(/<table[^>]*>([\s\S]*?)<\/table>/)[1];
const specRows=[...specsTable.matchAll(/<tr><th scope="row">([\s\S]*?)<\/th><td>([\s\S]*?)<\/td><\/tr>/g)];assert.equal(specRows.length,12);
replacements[13]=standard(`${heading(sections[13])}<div class="apdp-dialfit-compare apdp-massager-specs" role="table" aria-label="AirRelief specifications">${specRows.map(m=>`<div role="row"><span role="rowheader">${m[1]}</span><span role="cell">${m[2]}</span></div>`).join('\n')}</div><div class="apdp-dialfit-copy">${paragraphs(sections[13]).join('')}</div>`);
const accordion=sections[14].match(/<div class="apdp-tail-accordion">[\s\S]*?<\/div>/)[0];
replacements[14]=`<section class="apdp-tail apdp-tail-faq apdp-shell apdp-dialfit-full alta-pdp-flow-section apdp-dialfit-section">${heading(sections[14])}${accordion}</section>`;
const guaranteeHeading=heading(sections[15]).match(/title: '([\s\S]*?)'/)[1];
const guaranteeParagraphs=paragraphs(sections[15]);const guaranteeCta=sections[15].match(/<a class="apdp-button[\s\S]*?<\/a>/)[0];
replacements[15]=`<section class="apdp-dialfit-guarantee-section apdp-tail alta-pdp-flow-section apdp-dialfit-section"><div class="apdp-shell apdp-dialfit-full"><div class="apdp-dialfit-guarantee">${icon('shield')}<div><h2>${guaranteeHeading}</h2>${guaranteeParagraphs.slice(0,2).join('')}</div>${guaranteeCta}</div>${guaranteeParagraphs.at(-1).replace('airrelief-copy','apdp-dialfit-gifting')}</div></section>`;
const final=sections[17];const finalTitle=final.match(/<h2>([\s\S]*?)<\/h2>/)[1];const finalParagraphs=paragraphs(final);const finalProduct=final.match(/<h3>([\s\S]*?)<\/h3>/)[1];const finalPrice=final.match(/<div class="apdp-price">([\s\S]*?)<\/div>/)[1];const finalButton=final.match(/<button[\s\S]*?<\/button>/)[0].replace('apdp-button apdp-button--primary','apdp-final-button');
const finalTherapies=`<div class="apdp-final-benefits">${['Compression.','Heat.','Vibration.'].map((text,n)=>`<span>${icon(['sliders','spark','heart'][n])}<b>${text}</b></span>`).join('')}</div>`;
const finalPayments=reference.slice(reference.indexOf('      <div class="apdp-final-payments">'),reference.indexOf('    </div>\n    <div class="apdp-final-cta__buy">')).replaceAll('apdp-dialfit-final-','apdp-massager-final-');
assert.ok(finalPayments.includes('payment_type_svg_tag'));
replacements[17]=`<section id="AirReliefFinal-{{ section.id }}" class="apdp-final-cta alta-pdp-flow-section"><div class="apdp-shell apdp-final-cta__inner">{% if section.settings.final_cta_image != blank %}<div class="apdp-final-cta__product apdp-tail-media">${image('final_cta_image',700,'320, 500, 700','(min-width: 768px) 330px, 70vw')}</div>{% endif %}<div class="apdp-final-cta__content"><h2>${finalTitle}</h2>${finalParagraphs[0]}${finalTherapies}${finalParagraphs[2]}<p>${finalProduct}</p>${finalPayments}</div><div class="apdp-final-cta__buy"><p>${finalPrice}</p>${finalButton}${finalParagraphs.at(-1).replace('<p>','<p class="apdp-final-fine">')}</div><div class="apdp-final-badge" aria-hidden="true"><div class="apdp-dialfit-seal">${icon('shield')}</div></div></div></section>`;
let result=original;for(let index=17;index>=1;index--)result=result.replace(sections[index],replacements[index]);
result=result.replaceAll('apdp-massager-highlight','apdp-dialfit-highlight').replaceAll('apdp-massager-section','apdp-dialfit-section');
// Load the same common stylesheet. Only the source's section-scoped rules need cloning.
result=result.replace("{{ 'altaeron-pdp-massager.css' | asset_url | stylesheet_tag }}","{{ 'altaeron-pdp.css' | asset_url | stylesheet_tag }}\n{{ 'altaeron-pdp-massager.css' | asset_url | stylesheet_tag }}");
result=result.replace(/<style>[\s\S]*?<\/style>/g,'');
const styles=reference.match(/<style>([\s\S]*?)<\/style>/)[1];
// Unused source-only size-dialog, testimonial and gallery-story selectors are omitted.
const filtered=styles.split(/\r?\n/).filter(line=>!/^\s*#AltaeronPdp-.*? \.(?:apdp-dialfit-size|apdp-size-chart|apdp-dialfit-review|apdp-gallery-story|apdp-dialfit-grid|apdp-dialfit-card)/.test(line)).join('\n');
result=result.replace('<div id="AltaeronPdp-',`<style>\n${filtered}\n</style>\n<div id="AltaeronPdp-`);
result=result.replace('altaeron-pdp--cro-hero altaeron-pdp--massager','altaeron-pdp--cro-hero altaeron-pdp--dialfit altaeron-pdp--massager');
// Keep existing IDs, schema, media assignments, copy, campaign and all purchase hooks intact.
assert.ok(result.includes('data-apdp-final-submit'));assert.equal((result.match(/<section\b/g)||[]).length,18);
assert.equal(result.slice(result.indexOf('{% schema %}')),original.slice(original.indexOf('{% schema %}')));
assert.ok(!result.includes('airrelief-two'));assert.ok(!result.includes('airrelief-expert'));
function wordInventory(sectionHtml){
 const text=sectionHtml.replace(/<script\b[\s\S]*?<\/script>/g,'').replace(/<(?:span|caption)[^>]*class="[^"]*visually-hidden[^"]*"[^>]*>[\s\S]*?<\/(?:span|caption)>/g,'').replace(/<span[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g,'').replace(/<b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/b>/g,'').replace(/\{% render 'altaeron-pdp-section-heading',[\s\S]*?title: '([^']*)'[\s\S]*?%\}/g,(_,title)=>title).replace(/\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/g,'').replace(/<[^>]*>/g,' ').replaceAll('&amp;','&');
 const counts={};for(const word of text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[])counts[word]=(counts[word]||0)+1;
 return Object.fromEntries(Object.entries(counts).sort(([a],[b])=>a.localeCompare(b)));
}
for(let index=0;index<18;index++)assert.deepEqual(wordInventory(replacements[index]),wordInventory(sections[index]),`Visible copy changed in section ${index}`);
await fs.writeFile('sections/altaeron-pdp-massager.liquid',result.replace(/\r\n/g,'\n').replace(/[ \t]+$/gm,''));
const css=`/* Same Altaeron stylesheet and actual DialFit component rules are loaded by the section.
   These exceptions handle AirRelief's existing content shape; no separate type/color scale. */
.altaeron-pdp--massager .apdp-massager-comparison-scroll{overflow-x:auto;margin-top:24px}
.altaeron-pdp--massager .apdp-massager-compare{min-width:630px}
.altaeron-pdp--massager .apdp-massager-neutral-portrait{align-items:center;display:flex;justify-content:center}
.altaeron-pdp--massager .apdp-massager-neutral-portrait>svg{height:54px;width:54px;color:var(--altaeron-primary,#006B5E)}
.altaeron-pdp--massager .apdp-final-badge svg{height:54px;width:54px;fill:none;stroke:currentColor;stroke-width:1.5}
.altaeron-pdp--massager .apdp-hero__grid:not(:has(.apdp-gallery)){grid-template-columns:1fr 1fr}
.altaeron-pdp--massager .apdp-hero__grid:not(:has(.apdp-gallery)) .apdp-narrative{grid-column:1}
.altaeron-pdp--massager .apdp-hero__grid:not(:has(.apdp-gallery)) .apdp-buy{grid-column:2}
`;
// Exceptions need the same section-ID specificity as the source's inline rules.
const scoped=`
#AltaeronPdp-{{ section.id }} .apdp-massager-steps-three{grid-template-columns:repeat(3,minmax(0,1fr))}
#AltaeronPdp-{{ section.id }} .apdp-massager-compare{margin-top:0}
#AltaeronPdp-{{ section.id }} .apdp-massager-compare>div{grid-template-columns:1.2fr repeat(4,minmax(0,1fr))}
#AltaeronPdp-{{ section.id }} .apdp-massager-compare>.apdp-dialfit-compare__media-row{grid-template-columns:1fr 1fr}
#AltaeronPdp-{{ section.id }} .apdp-massager-compare span:nth-child(n+3){background:transparent;color:inherit;font-weight:inherit}
#AltaeronPdp-{{ section.id }} .apdp-massager-compare .apdp-dialfit-compare__head span:nth-child(n+3){background:#f6f7f5;font-weight:800}
#AltaeronPdp-{{ section.id }} .apdp-dialfit-compare.apdp-massager-compare>div:not(.apdp-dialfit-compare__head):not(.apdp-dialfit-compare__media-row)>span+span:before,#AltaeronPdp-{{ section.id }} .apdp-dialfit-compare.apdp-massager-specs>div>span+span:before{content:none}
#AltaeronPdp-{{ section.id }} .apdp-dialfit-compare:is(.apdp-massager-compare,.apdp-massager-specs)>div:not(.apdp-dialfit-compare__head):not(.apdp-dialfit-compare__media-row)>span:first-child:before{content:none}
#AltaeronPdp-{{ section.id }} .apdp-dialfit-use-card:not(:has(.apdp-dialfit-use-card__art)):after{display:none}
#AltaeronPdp-{{ section.id }} .apdp-buy__trust{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px}
#AltaeronPdp-{{ section.id }} .apdp-buy__trust>:first-child{display:flex}
@media(max-width:767px){#AltaeronPdp-{{ section.id }} .apdp-massager-steps-three{grid-template-columns:1fr}}
`;
result=result.replace('</style>',`${scoped}\n</style>`);
await fs.writeFile('sections/altaeron-pdp-massager.liquid',result.replace(/\r\n/g,'\n').replace(/[ \t]+$/gm,''));
await fs.writeFile('assets/altaeron-pdp-massager.css',css);
console.log(JSON.stringify({sections:18,sharedStylesheet:'altaeron-pdp.css',massagerCssLines:css.split('\n').length,clonedSourceRuleLines:filtered.split('\n').length}));
