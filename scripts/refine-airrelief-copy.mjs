import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

// Keep the targeted copy pass reproducible when rebuilding the architecture.
const filename = 'sections/altaeron-pdp-massager.liquid';
let content = await fs.readFile(filename, 'utf8');
const replace = (before, after) => {
  assert.ok(content.includes(before) || content.includes(after), `Missing copy: ${before}`);
  content = content.replace(before, after);
};

replace(
  'Air compression, warming heat and high-frequency vibration work around your foot and ankle to loosen tightness, ease aching pressure and help tired, puffy feet feel lighter again.',
  'Air compression, warming heat and vibration surround tired feet and ankles to ease aching pressure, loosen tightness and help that heavy, puffy feeling melt away.'
);
replace(
  '<strong>Heavy after a long day?</strong><br>Give them 15 minutes of compression, warmth and vibration.<br>',
  '<strong>Take the weight off your feet — without leaving the sofa.</strong><br>'
);
replace(
  'Together, they deliver a more complete reset than heat or massage alone.',
  'Three ways to unwind, working together in one 15-minute session.'
);
replace(
  'If your favorite moment of the day is finally taking your shoes off, AirRelief was made for that moment.',
  'When taking your shoes off is the best part of your day, this is the next step.'
);
content = content.replace(' Typical alternatives vary by model.', '');

const practical = '<div class="apdp-dialfit-benefits apdp-massager-practical">';
const support = '<div class="apdp-tail-accordion apdp-massager-support"><details><summary>What 15 Minutes Can Feel Like';
const start = content.indexOf(practical);
const end = content.indexOf(support, start);
assert.ok(start > 0 && end > start, 'Locate chapter 6 supporting content');
content = content.slice(0, start) + practical + [
  ['CORDLESS', 'Up to 1–2 hours of use per charge.'],
  ['ADJUSTABLE FIT', 'Secure hook-and-loop wrap for different foot and ankle shapes.'],
  ['15-MINUTE SESSIONS', 'Easy to fit into your evening routine.'],
].map(([title, body]) => `<article><h3>${title}</h3><p>${body}</p></article>`).join('') + '</div>' + content.slice(end);

const bodyStart = content.indexOf('<div class="apdp-massager-support__body">', content.indexOf(support));
const bodyEnd = content.indexOf('</div></details></div>', bodyStart);
assert.ok(bodyStart > 0 && bodyEnd > bodyStart, 'Locate session progression');
content = content.slice(0, bodyStart) + '<div class="apdp-massager-support__body"><p class="airrelief-copy">As the session continues, warmth builds while compression works through its squeeze-and-release rhythm. By the end, tired areas can feel warmer, looser and less heavy.</p>' + content.slice(bodyEnd);

replace(
  '<p>Designed for relaxation and post-activity comfort.',
  '<p class="apdp-massager-medical-footnote">Designed for relaxation and post-activity comfort.'
);
if (!content.includes('/* Compact chapter 6 support and secondary medical footnote. */')) {
  content = content.replace('</style>', `/* Compact chapter 6 support and secondary medical footnote. */
#AltaeronPdp-{{ section.id }} .apdp-dialfit-benefits.apdp-massager-practical{grid-template-columns:repeat(3,minmax(0,1fr))}
#AltaeronPdp-{{ section.id }} .apdp-expert__criteria>p.apdp-massager-medical-footnote{color:var(--apdp-muted);font-size:12px;font-weight:400;line-height:1.45}
@media(max-width:767px){
  #AltaeronPdp-{{ section.id }} .apdp-dialfit-benefits.apdp-massager-practical{grid-template-columns:1fr}
  #AltaeronPdp-{{ section.id }} .apdp-massager-practical article+article{border-left:0}
}
</style>`);
}
await fs.writeFile(filename, content);
console.log('Applied targeted AirRelief copy refinement; preserved purchase, media and section structure.');
