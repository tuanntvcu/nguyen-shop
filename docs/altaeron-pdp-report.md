# Altaeron PDP correction report

Generated: 2026-08-06

QA theme: `Development (771095-DESKTOP-B231O49)` (`140844204093`)

## Scope and deployment

The `product.altaeron` PDP was corrected against the supplied desktop and mobile references. It was validated on the development theme, then the same seven scoped PDP files were promoted to production theme `nguyen-shop/main` (`140538314813`). The announcement bar, global header, global footer, global layout, and unrelated templates were not edited.

Mobile is one continuous document column. Horizontal scrolling is contained to designated card rails only.

## Files

Modified in this correction pass:

- `assets/altaeron-pdp.css`
- `sections/altaeron-pdp.liquid`
- `scripts/qa-pdp-reference.mjs`
- `docs/altaeron-pdp-report.md`

Existing scoped PDP worktree files preserved and included by the development deployment helper:

- `assets/altaeron-pdp.js`
- `snippets/altaeron-pdp-card.liquid`
- `snippets/altaeron-pdp-icon.liquid`
- `snippets/altaeron-pdp-media.liquid`
- `templates/product.altaeron.json`
- `scripts/deploy-pdp-theme.mjs`

Generated QA artifacts are under `tmp/pdp-reference-qa/` and backups under `tmp/pdp-audit/`. No source files were removed.

## Layout results

- Desktop container: `1336px` maximum width, centered, with `32px` gutters at 1440px.
- Desktop hero grid: `43% / 29% / 28%`, with `28px` gaps.
- Desktop gallery stage: explicit `1.02 / 1` aspect ratio with cover cropping and fixed thumbnail rail.
- The desktop headline is 36px in the available theme font to preserve the reference's two-line wrap; the supplied 40px starting value produced a visibly incorrect three-line headline.
- Purchase card: 500px minimum height at wide desktop, full-width 52px CTA, real product form and live variant state.
- How It Works desktop media: corrected to `1.9 / 1`.
- Familiar media: `1.6 / 1` desktop and `1.05 / 1` mobile.
- Story video: `1.55 / 1` desktop and `1.43 / 1` mobile.
- Moments media: `1.45 / 1` desktop and `1 / 1` mobile.
- Support product media: `1.2 / 1` desktop and `0.9 / 1` mobile.
- Desktop reassurance is a title panel plus four value cells plus separate guarantee card. Mobile stacks the title above four compact value cells and omits the duplicate guarantee card.
- Mobile sticky ATC: 82px high, 10px side inset, 8px plus safe-area bottom offset, 13px radius, 46/54 information/action split, synchronized with the primary product form.

## Review handling and truthful-content limits

Judge.me currently exposes zero usable product reviews. The entire testimonials section is therefore omitted. No customer-facing empty/technical placeholder remains, and no names, portraits, quotes, ratings, review counts, occupations, or verified labels were invented.

Current product/lifestyle images and the fantasy video remain temporary store media. Their layout frames and cropping are corrected; their content does not match the comps. Helpful Guide blocks have configurable titles and summaries but no links because no matching real articles were available. The live FAQ metafield contains five questions rather than the seven shown in the concept. Unsupported customer counts, medical promises, delivery windows, bundle percentages, and guarantee claims were not added.

## Browser QA

Final suite:

- 1440×1000
- 1280×900
- 1024×900
- 768×900
- 390×844
- 375×812

All development renders returned HTTP 200, produced zero page errors, and had `scrollWidth === clientWidth`. Production was then smoke-tested at 1440×1000 and 375×812 with the same result. The only console messages were the pre-existing Shop Pay preview iframe CSP/403 messages. Sticky ATC was explicitly measured after the hero left view and captured separately at 390px and 375px.

Normalized 50% reference overlays are saved as `tmp/pdp-reference-qa/overlay-desktop-1440.png` and `tmp/pdp-reference-qa/overlay-mobile-375-first-segment.png`. PDP content starts were aligned before compositing because the global header is intentionally outside task scope; the mobile overlay uses the first pane of the side-by-side reference.

The development-theme preview toolbar may appear across preview screenshots even after its iframe is removed by QA automation; it is not storefront content. Exact media content, absent real testimonials, five live FAQ entries, and untouched global header/footer styling remain the material differences from the concept.

## Global confirmation

- Announcement bar untouched.
- Global header untouched.
- Global footer untouched.
- Mobile is one continuous vertical page, not a two-column PDP.
