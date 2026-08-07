# Altaeron PDP final correction report

Generated: 2026-08-06

Development theme: `Development (771095-DESKTOP-B231O49)` (`140844204093`)

Production theme: `nguyen-shop/main` (`140538314813`)

## Files

Modified in this final pass:

- `assets/altaeron-pdp.css`
- `assets/altaeron-pdp.js`
- `sections/altaeron-pdp.liquid`
- `scripts/qa-pdp-reference.mjs`
- `docs/altaeron-pdp-report.md`

The scoped deployment also included the existing PDP snippets and `templates/product.altaeron.json`; those files were not changed in this final pass. No source files were removed.

Generated files:

- `tmp/pdp-reference-qa/report-final-development.json`
- `tmp/pdp-reference-qa/report-final-production.json`
- `tmp/pdp-reference-qa/overlay-final-desktop-1440.png`
- `tmp/pdp-reference-qa/overlay-final-mobile-375-first-segment.png`
- Final viewport screenshots under `tmp/pdp-reference-qa/`

## Cleanup and functionality

- Repaired the malformed variant update loop in `altaeron-pdp.js`; `node --check` now passes.
- Removed a duplicate compare-at price update branch.
- Added selected-variant savings synchronization to the sticky cart.
- Replaced supplier product titles/descriptions in the support routine with configurable Day Support, Night Support, and Recovery labels and short benefits.
- No customer-facing review placeholder exists.
- One native product form remains; the sticky CTA dispatches that form rather than creating a second form.

## Final layout

- Desktop container: `1360px` maximum, centered with 40px measured gutters at 1440px.
- Wide desktop hero: `43% / 29% / 28%`, 28px gaps.
- 1440px hero grid: `1360×540px`.
- 1440px gallery: `561×505px`; narrative: `378×533px`; purchase card: `365×540px`.
- 375px hero: `375×708px`; narrative: `375×585px`; purchase area: `375×123px`.
- Headline: scoped serif treatment with exact two-line desktop, three-line mobile, and three-line narrow-tablet groupings. Custom merchant headlines remain dynamic.
- Trust strip: `1360×90px` desktop and `351×128px` at 375px.
- Familiar card: `325×316px` desktop and `187×309px` mobile, with explicit snap-scrolling on mobile.
- Reassurance strip now has separate bold heading and supporting sentence.
- Desktop Support is restrained to the heading shown in the reference; mobile retains the three product-linked routine cards and truthful bundle CTA.
- Desktop No Miracles uses one heading/pillar panel plus a separate 25% policy panel.
- FAQ contains seven entries, uses existing metafield items first, and adds two configurable safety-focused fallbacks when needed.

Corrected UI aspect ratios:

- Desktop gallery stage: `0.95 / 1` (near-square portrait-leaning frame)
- Familiar media: `1.5 / 1` desktop; `1 / 1` mobile
- Story video: `1.85 / 1` desktop; `1.32 / 1` mobile
- How It Works: `2 / 1` desktop; media hidden in the target mobile step layout
- Moments: `1.45 / 1` desktop; `0.95 / 1` mobile
- Support media: `1.2 / 1` desktop/tablet; `0.86 / 1` mobile
- Shoe media: `1 / 1`

## Reviews and truthful data

Judge.me currently exposes zero usable product reviews. The entire live review section is omitted. No names, portraits, quotes, ratings, review counts, occupations, or verified labels were fabricated.

Current product/lifestyle images and the fantasy video remain temporary store media. Helpful Guide titles and summaries are configured, but cards without real article URLs remain non-linked. Unsupported customer counts, review claims, fixed delivery windows, medical promises, bundle discounts, and guarantee promises were not added.

## Sticky add to cart

- 375px: `355×84px`, x-position 10px.
- 390px: `370×84px`, x-position 10px.
- 8px plus safe-area bottom offset, 14px radius, 47/53 content/action split.
- Shows a configurable short title, current price, compare-at price, and live savings.
- Appears only after the primary CTA leaves the viewport.
- Updates with the selected variant, availability, and sold-out state.
- QA observed a native `/cart/add` request from the 375px sticky CTA.

## QA and remaining differences

Development captures passed at 1440, 1280, 1024, 768, 390, and 375px. Production passed at 1440 and 375px. Every render returned HTTP 200, had zero page errors, and reported `scrollWidth === clientWidth`.

The two console messages are Shopify's existing Shop Pay preview iframe CSP/403 messages. They are unrelated to PDP code.

Normalized 50% overlays align the PDP content start because global chrome is outside scope. The mobile overlay uses the first pane of the side-by-side target. Remaining visual differences are the temporary media content, absent real testimonials, the target's unverified customer/review claims, and the untouched global header/footer styling. The exact target editorial font is not loaded by the active theme; the PDP uses a scoped system serif approximation for the hero only.

The announcement bar, global header, global navigation, footer, and footer menus were untouched. Mobile is one continuous vertical document; only the designated card rows scroll horizontally.
