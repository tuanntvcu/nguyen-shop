import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';

const section = await fs.readFile('sections/altaeron-support-timeline.liquid', 'utf8');
const template = JSON.parse((await fs.readFile('templates/product.altaeron-reels-v3.json', 'utf8')).replace(/^\/\*[\s\S]*?\*\//, ''));
const overTimeCopy = template.sections.altaeron_support_timeline.settings;

assert.equal(overTimeCopy.reassurance_heading, 'OVER TIME');
assert.equal(
  overTimeCopy.reassurance_text,
  'Progressively Reinforce Better Alignment\n\nRealignment is cumulative. Repeated corrective positioning gives the muscles and soft tissues around the big toe time to adapt toward a healthier anatomical position.\n\nCorrect. Adapt. Repeat.',
);
assert.match(section, /template\.suffix == 'altaeron-reels-v3'[\s\S]*alta-timeline__reassurance--editorial/);
assert.match(section, /reassurance_text \| newline_to_br \| split: '<br \/>'/);

const editorialCss = section
  .match(/\/\* Reel V3: lightweight editorial treatment for the OVER TIME block only\. \*\/([\s\S]*?)\{% render 'altaeron-reels-v3-responsive-section'/)[1]
  .replaceAll('{{ section.id }}', 'Test');

const browser = await chromium.launch({ headless: true });

for (const width of [360, 375, 390, 430, 768, 1024, 1280, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  await page.setContent(`<!doctype html><html><head><style>
    :root{--altaeron-off-white:#f8faf9;--altaeron-border:#e4e7ec;--altaeron-primary:#006b5e;--altaeron-navy:#102a43;--altaeron-body:#344054;--alta-timeline-line:var(--altaeron-border);--alta-timeline-accent:var(--altaeron-primary);--alta-timeline-ink:var(--altaeron-navy);--alta-timeline-body:var(--altaeron-body)}
    *{box-sizing:border-box}body{margin:0}.alta-timeline__shell{margin-inline:auto;width:calc(100% - 30px)}
    .alta-timeline__stages{height:180px;margin-inline:auto;max-width:904px}
    ${editorialCss}
  </style></head><body class="altaeron-reels-v3">
    <section id="AltaeronTimeline-Test">
      <div class="alta-timeline__shell">
        <div class="alta-timeline__stages"></div>
        <div class="alta-timeline__reassurance alta-timeline__reassurance--editorial">
          <svg aria-hidden="true" viewBox="0 0 32 32"></svg>
          <strong>OVER TIME</strong>
          <div class="alta-timeline__reassurance-copy">
            <p class="alta-timeline__reassurance-subtitle">Progressively Reinforce Better Alignment</p>
            <p class="alta-timeline__reassurance-body">Realignment is cumulative. Repeated corrective positioning gives the muscles and soft tissues around the big toe time to adapt toward a healthier anatomical position.</p>
            <p class="alta-timeline__reassurance-closing">Correct. Adapt. Repeat.</p>
          </div>
        </div>
      </div>
    </section>
  </body></html>`);

  const layout = await page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height };
    };
    const card = document.querySelector('.alta-timeline__reassurance--editorial');
    const icon = document.querySelector('.alta-timeline__reassurance--editorial svg');
    const body = document.querySelector('.alta-timeline__reassurance-body');
    const closing = document.querySelector('.alta-timeline__reassurance-closing');
    const label = document.querySelector('.alta-timeline__reassurance--editorial > strong');
    const subtitle = document.querySelector('.alta-timeline__reassurance-subtitle');
    const cardStyle = getComputedStyle(card);
    return {
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      stages: rect('.alta-timeline__stages'),
      card: rect('.alta-timeline__reassurance--editorial'),
      label: rect('.alta-timeline__reassurance--editorial > strong'),
      subtitle: rect('.alta-timeline__reassurance-subtitle'),
      body: rect('.alta-timeline__reassurance-body'),
      closing: rect('.alta-timeline__reassurance-closing'),
      styles: {
        background: cardStyle.backgroundColor,
        border: cardStyle.borderTopWidth,
        shadow: cardStyle.boxShadow,
        textAlign: cardStyle.textAlign,
        iconDisplay: getComputedStyle(icon).display,
        labelFontSize: getComputedStyle(label).fontSize,
        labelLetterSpacing: getComputedStyle(label).letterSpacing,
        subtitleFontSize: getComputedStyle(subtitle).fontSize,
        bodyFontSize: getComputedStyle(body).fontSize,
        bodyLineHeight: getComputedStyle(body).lineHeight,
        closingWeight: getComputedStyle(closing).fontWeight,
      },
    };
  });

  assert.equal(layout.scrollWidth, layout.viewport, `${width}px layout must not overflow`);
  assert.equal(layout.styles.background, 'rgb(248, 250, 249)');
  assert.equal(layout.styles.border, '0px');
  assert.equal(layout.styles.shadow, 'none');
  assert.equal(layout.styles.textAlign, 'left');
  assert.equal(layout.styles.iconDisplay, 'none');
  assert.equal(layout.styles.labelFontSize, '11px');
  assert.equal(layout.styles.labelLetterSpacing, '0.66px');
  assert.equal(layout.styles.subtitleFontSize, '16px');
  assert.equal(layout.styles.bodyFontSize, '16px');
  assert.equal(layout.styles.bodyLineHeight, '25.28px');
  assert.equal(layout.styles.closingWeight, '600');
  assert.ok(Math.abs(layout.card.top - layout.stages.bottom - 16) < 1, `${width}px progression gap must remain compact`);
  assert.ok(Math.abs(layout.label.left - layout.subtitle.left) < 1, `${width}px header copy must align left`);
  assert.ok(Math.abs(layout.body.left - layout.subtitle.left) < 1, `${width}px body copy must share the left text axis`);
  assert.ok(Math.abs(layout.body.left - layout.closing.left) < 1, `${width}px closing line must align with body copy`);
  if (width === 375) assert.ok(layout.card.height < 360, '375px block must remain compact');
  if (width >= 900) {
    assert.ok(layout.card.width <= 904.5, `${width}px block must not stretch beyond the stage grid`);
    assert.ok(Math.abs(layout.card.left - layout.stages.left) < 1, `${width}px block must align with the stage grid`);
  }

  await page.close();
}

await browser.close();
console.log('Reel V3 OVER TIME editorial block passed responsive checks');
