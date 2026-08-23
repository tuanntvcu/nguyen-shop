import { chromium } from '../tmp/pw/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';

const url = process.env.QA_URL || 'https://altaeron.com/';
const runs = Number(process.env.QA_RUNS || 4);
const useLocalTheme = process.env.QA_LOCAL_THEME === '1';
const viewports = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

const browser = await chromium.launch({ headless: true });
const report = [];

async function snapshot(page, label) {
  return page.evaluate((snapshotLabel) => {
    const bodyStyle = getComputedStyle(document.body);
    const htmlStyle = getComputedStyle(document.documentElement);
    const openModals = [...document.querySelectorAll('modal-component[open], basic-modal[open], drawer-component[open], subscription-popup[open]')].map(
      (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: element.className,
          active: element.hasAttribute('active'),
          hidden: element.hidden,
          inert: element.hasAttribute('inert'),
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          pointerEvents: style.pointerEvents,
          rect: { width: Math.round(rect.width), height: Math.round(rect.height) },
        };
      }
    );
    const topElement = document.elementFromPoint(innerWidth / 2, innerHeight / 2);

    return {
      label: snapshotLabel,
      time: Math.round(performance.now()),
      scrollY: Math.round(scrollY),
      maxScrollY: Math.round(document.documentElement.scrollHeight - innerHeight),
      bodyClass: document.body.className,
      bodyOverflow: bodyStyle.overflow,
      htmlOverflow: htmlStyle.overflow,
      openModals,
      topElement: topElement ? `${topElement.tagName.toLowerCase()}#${topElement.id}.${topElement.className}` : null,
    };
  }, label);
}

for (const viewport of viewports) {
  for (let run = 1; run <= runs; run += 1) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.isMobile,
      locale: 'en-US',
    });
    const page = await context.newPage();
    if (useLocalTheme) {
      const localTheme = await fs.readFile(new URL('../assets/theme.js', import.meta.url), 'utf8');
      await page.route(/\/assets\/theme\.js(?:\?|$)/, (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: localTheme })
      );
    }
    const errors = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(`console: ${message.text()}`));
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

    await page.goto(`${url}${url.includes('?') ? '&' : '?'}scroll_lock_audit=${viewport.name}-${run}-${Date.now()}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(1200);

    const snapshots = [await snapshot(page, 'loaded')];
    let unexpectedLock = null;

    for (let step = 1; step <= 12; step += 1) {
      const before = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 420);
      await page.waitForTimeout(450);
      const state = await snapshot(page, `scroll-${step}`);
      snapshots.push(state);

      const shouldMove = before < state.maxScrollY - 2;
      const moved = state.scrollY > before + 1;
      const visibleOpenModal = state.openModals.some(
        (modal) => !modal.hidden && modal.display !== 'none' && modal.visibility !== 'hidden' && Number(modal.opacity) > 0 && modal.rect.width > 0 && modal.rect.height > 0
      );
      const bodyLocked = ['hidden', 'clip'].includes(state.bodyOverflow) || /\bmodal-show(?:ing)?\b/.test(state.bodyClass);

      if (shouldMove && !moved && bodyLocked && !visibleOpenModal) {
        unexpectedLock = state;
        break;
      }

      if (visibleOpenModal) {
        const close = page.locator('subscription-popup[open] button[is="close-button"], subscription-popup[open] .drawer__close-btn, [open] button[is="close-button"], [open] .drawer__close-btn').first();
        if (await close.count()) {
          await close.click({ force: true });
          await page.waitForTimeout(900);
          snapshots.push(await snapshot(page, `closed-modal-${step}`));
        }
      }
    }

    const finalBefore = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    const finalState = await snapshot(page, 'final-scroll');
    const scrollRecovered = finalBefore >= finalState.maxScrollY - 2 || finalState.scrollY > finalBefore + 1;

    const modalChecks = [];
    if (run === 1) {
      for (const [name, selector] of [
        ['menu', '.menu-drawer-button:visible'],
        ['search', '.search-drawer-button:visible'],
        ['cart', '.cart-drawer-button:visible'],
      ]) {
        const control = page.locator(selector).first();
        if (!(await control.count())) continue;

        const controlledId = await control.getAttribute('aria-controls');
        const modal = controlledId ? page.locator(`#${controlledId}`) : null;
        if (!modal || !(await modal.count())) continue;

        await control.click();
        await page.waitForTimeout(900);
        const openState = await snapshot(page, `${name}-open`);
        const opensVisibly = await modal.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return (
            element.hasAttribute('open') &&
            !element.hidden &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            rect.width > 0 &&
            rect.height > 0
          );
        });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(900);
        const closeState = await snapshot(page, `${name}-closed`);
        modalChecks.push({
          name,
          opensVisibly,
          locksWhileOpen: /\bmodal-show\b/.test(openState.bodyClass) && openState.bodyOverflow === 'hidden',
          closes: !(await modal.evaluate((element) => element.hasAttribute('open'))),
          unlocksAfterClose:
            !/\bmodal-show(?:ing)?\b/.test(closeState.bodyClass) && !['hidden', 'clip'].includes(closeState.bodyOverflow),
        });
      }
    }

    report.push({ viewport: viewport.name, run, unexpectedLock, scrollRecovered, modalChecks, errors, snapshots });
    await context.close();
  }
}

await browser.close();

const summary = report.map(({ viewport, run, unexpectedLock, scrollRecovered, modalChecks, errors, snapshots }) => ({
  viewport,
  run,
  unexpectedLock: Boolean(unexpectedLock),
  scrollRecovered,
  modalChecks,
  errors: errors.length,
  errorMessages: [...new Set(errors)],
  locks: snapshots
    .filter((state) => /\bmodal-show(?:ing)?\b/.test(state.bodyClass))
    .map((state) => ({ label: state.label, bodyClass: state.bodyClass, bodyOverflow: state.bodyOverflow, openModals: state.openModals })),
}));

console.log(JSON.stringify({ url, runs, useLocalTheme, summary }, null, 2));

if (
  summary.some(
    (result) =>
      result.unexpectedLock ||
      !result.scrollRecovered ||
      result.modalChecks.some(
        (check) => !check.opensVisibly || !check.locksWhileOpen || !check.closes || !check.unlocksAfterClose
      )
  )
) {
  process.exitCode = 1;
}
