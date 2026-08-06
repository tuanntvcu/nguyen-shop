# Altaeron homepage completion report

Date: 2026-08-05  
Store: `i9f8uv-gq.myshopify.com` / `altaeron.com`  
Development theme: `gid://shopify/OnlineStoreTheme/140844204093`  
Preview: `https://altaeron.com/?preview_theme_id=140844204093`  
Status: ready for merchant review in the development theme. The live theme was not published or overwritten.

## 1. Initial mismatches

- Homepage structure was present but desktop typography and vertical rhythm were too compressed.
- Mobile hero copy was positioned against the page instead of the hero, causing its first line to be hidden.
- Tablet rendered mobile and desktop navigation simultaneously.
- Concern/product/demo media used supplier-first featured images, including text and infographic overlays.
- Product cards had inconsistent title/rating/price baselines and no desktop arrow controls.
- Quiz was a shallow text-button strip with no icons, Back action, disclaimer, selected state, or complete event set.
- The supplied Shopify video had not been resolved and demonstration cards were static.
- Negative Judge.me reviews were being selected for homepage social proof.
- The three real articles had no cover images or reading-time presentation.
- Footer had four generic columns, no brand/mission column, incomplete menus, and `Powered by Shopify`.
- Mobile announcement rendered three small messages in one row.
- The first accessibility pass found 20 homepage images without an `alt` attribute.

## 2. Layout and component work

- Kept one vertical page in the required 14-part order; no page-level CSS columns were introduced.
- Desktop container is 1360 px max (94.4% of a 1440 px viewport), hero is 540 px, desktop section rhythm is primarily 78 px, and compact strips remain tighter.
- Mobile page padding is 16 px, H1 is 40 px, H2 is 28 px, buttons are at least 44 px, and main section rhythm is 56 px.
- Hero uses a 40/60 desktop split and a purpose-built 600 px mobile composition.
- Trust is four columns desktop and readable 2×2 mobile.
- Concern cards are four across desktop, 2×2 mobile, fully clickable, equal-height, and use clean-media overrides.
- Popular products show four cards desktop and roughly 2.2 cards mobile with scroll snap, 44 px dots, desktop arrows, real prices, variants, availability, compare-at data, and review data.
- Quiz now has three steps, icon options, selected states, Back, collection-backed results, a non-medical-advice disclaimer, focus movement, and CRO events.
- Demonstrations render five clean product posters and open one lazy-loaded Shopify video dialog with native controls, Escape close, focus handling, and pause-on-close.
- Values use the approved three pillars. Reviews are filtered to positive real Judge.me content. Guides use real blog articles plus Shopify file-reference covers.
- FAQ uses policy-safe wording. Newsletter remains a real Shopify customer form.
- Footer is brand + Shop by Concern + Help + Company + Customer Care, followed by copyright and real `shop.enabled_payment_types`; mobile menus are accordions.

## 3. Files modified

- `assets/altaeron-home.css`
- `assets/altaeron-home.js`
- `config/settings_data.json`
- `config/settings_schema.json`
- `sections/altaeron-home.liquid`
- `sections/announcement-bar.liquid`
- `sections/footer-group.json`
- `sections/footer.liquid`
- `sections/header-group.json`
- `sections/header.liquid`
- `snippets/altaeron-home-product.liquid`
- `templates/index.json`
- `templates/product.altaeron.json`

## 4. Files created

- `scripts/altaeron-data.mjs`
- `scripts/audit-altaeron-layout.mjs`
- `scripts/apply-altaeron-layout-data.mjs`
- `scripts/upsert-development-theme.mjs`
- `scripts/capture-home.mjs`
- `scripts/qa-home.mjs`
- `scripts/inspect-home-alt.mjs`
- `scripts/product-media-contact-sheet.mjs`
- `docs/altaeron-homepage-report.md`

## 5. Admin GraphQL work (API 2026-07)

Queries covered shop, products, all variants/prices, media, files, metafields, collections, menus, blogs/articles, publications, themes, and theme files. Before/after payloads are in `tmp/homepage-audit`.

Mutations executed with `userErrors` checks:

- `metafieldDefinitionCreate`
- `metafieldsSet`
- `collectionCreate`
- `productUpdate`
- `menuUpdate`
- `publishablePublish`
- `themeFilesUpsert`

Theme uploads contain 13 changed files and target only development theme `140844204093`.

## 6. Shopify data created or normalized

Collections created, populated, and published:

- Bunion & Toe Alignment
- Heel & Plantar Fascia
- Ankle Support
- Recovery & Massage

Product metafields:

- `custom.concern`
- `custom.short_benefit`
- `custom.product_badge`
- `custom.quiz_tags`
- `custom.homepage_card_image`
- `custom.short_title`
- `custom.homepage_priority`

Other metafields:

- Article `custom.cover_image`
- Shop `custom.homepage_demo_video`

Seven product titles/handles were normalized, redirects requested, and collection assignments added. The main menu and `footer-shop`, `footer-support`, and `footer-company` menus were updated. Customer Care uses the store's real contact email; no support hours or phone number were invented.

## 7. Product price/media audit

- `$9.04` is the real price of the `Gray` variant of Breathable Bunion Support; its compare-at price is `$12.43`. It was not changed.
- All seven products received a non-destructive homepage image reference. Product galleries and original media were not deleted or reordered.
- Hero, concern, product, demo, article, and review fallbacks now prefer Shopify file-reference overrides rather than raw featured-media order.
- Some original Shopify assets still contain small supplier labels, most visibly on the massager. Replacing those source assets would improve art direction further, but layout no longer depends on supplier infographic cards.

## 8. Video

The supplied admin file ID resolved to:

- GID: `gid://shopify/Video/27758272446525`
- Status: READY
- Original: 960×960 MP4
- Shopify renditions: 480p MP4, 720p MP4, and HLS

It is stored in `shop.metafields.custom.homepage_demo_video` and reused by the five demonstration triggers. Only one video element exists, uses `preload="none"`, and is opened on demand.

## 9. Real reviews selected

Source: `judgeme.review_widget_data` product metafields. Homepage filtering requires rating 4+, useful body text, and excludes known negative/defect wording. No reviewer occupation, verification badge, or customer identity was invented.

Rendered examples include:

- Douglass Kassulke — “Everything perfect!”
- Iraida Conroy — “Easy to use and makes movement better”
- Pasty Wisozk — “Well received, everything is OK. Thank you!!!”

Aggregate shown: 4.6/5 from 22 real imported reviews, computed from the two products with non-zero review data (4.0/7 and 4.87/15).

## 10. Blog/articles

- Can Bunion Correctors Really Help?
- How to Relieve Foot Pain Naturally
- What Causes Bunions and How to Treat Them

All three use real article URLs, calculated reading time, and `custom.cover_image` references to existing Shopify media.

## 11. Final screenshots

- `tmp/screenshots/final/homepage-375.png`
- `tmp/screenshots/final/homepage-390.png`
- `tmp/screenshots/final/homepage-768.png`
- `tmp/screenshots/final/homepage-1024.png`
- `tmp/screenshots/final/homepage-1440.png`

The iteration trail is in `tmp/screenshots/round-0`, `round-1`, and `round-2`. The black strip seen in merchant preview screenshots was Shopify's preview-bar iframe, not storefront theme layout; the capture script removes it before comparison.

## 12. Reference comparison

The final geometry matches the reference layout model: full-width warm hero, compact trust strip, 4/2 concern grid, 4/2.2 product rail, horizontal/full-card quiz, 5-card demo rail, readable pillars, 3-card desktop reviews, thumbnail guide cards, 2/1 FAQ grid, horizontal/mobile-inline newsletter, and 5-column/accordion footer.

The remaining visual delta is primarily photography and the source logo artwork, not page structure. Because the merchant explicitly allowed existing images, no synthetic customer photography or fake testimonials were generated. The result should not be described as literal pixel-perfect while those source assets differ from the reference.

## 13. Lighthouse

Mobile lab runs are network and preview-bar dependent:

| Run | Performance | Accessibility | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Live baseline | 33 | 93 | 75 | 100 |
| Earlier development best | 53 | 90 | 71 | 100 |
| Final development | 47 | 93 | 79 | 100 |

Final metrics: LCP 4.5 s, CLS 0.027, TBT 2,110 ms. Performance is above the live baseline. Lighthouse's remaining accessibility failures are the Shopify preview iframe without a title and a footer contrast result that conflicts with direct computed styles (`rgb(255,255,255)` on `rgb(3,47,38)`). A live-theme run without the injected preview iframe is still recommended after publication.

## 14. Accessibility and functional QA

Tested at 320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440, and 1920 px:

- No horizontal overflow at any breakpoint.
- 0 homepage images missing `alt`; 0 unnamed homepage buttons.
- One H1, skip link retained, quiz fieldsets/legends, native FAQ details, visible focus styles, and reduced-motion handling.
- Quiz Back and all three steps pass; first path returns `/collections/bunion-toe-alignment`.
- Video opens on demand, has one MP4 source, `preload="none"`, closes with Escape, and pauses on close.
- Mobile drawer opens/closes with Escape; search/cart triggers are present.
- FAQ opens; newsletter input and submit exist.
- Products needing option selection link to PDP instead of adding an arbitrary first variant.
- No theme-owned console errors. Preview sessions log only Shopify Shop Pay iframe CSP/403 messages.

Machine-readable results: `tmp/homepage-audit/qa-report.json`.

## 15. Remaining issues

- A few massager source images still have small embedded supplier labels. Clean merchant photography would remove the last media mismatch.
- Product variants all require selection, so homepage cart icons correctly open PDPs instead of unsafe quick-add.
- Performance is constrained by the base theme/apps and Shopify preview environment; no new framework or slider library was added.
- The current logo source is a compact emblem, so a CSS wordmark was added on homepage. A proper wide logo asset would be preferable.

## 16. Rollback

- Store snapshots: `tmp/homepage-audit/graphql-state-before-mutations.json`, `layout-state-before-mutations.json`, and `shop-state-before.json`.
- Updated snapshots: `graphql-state-after-mutations.json` and `layout-state-after-mutations.json`.
- Original development-theme files: `tmp/homepage-audit/theme-before-initial` and per-upload snapshots in `tmp/homepage-audit/theme-before`.
- Theme rollback: submit the original file bodies through `themeFilesUpsert` to theme `140844204093`.
- Data rollback: restore the product/menu/metafield values from the before snapshots; unpublish/delete only the four recorded collection IDs if desired.
- The live theme was not overwritten, so customers do not need an emergency theme rollback.

## 17. Reference-scale correction pass (2026-08-05)

The undersized appearance came from geometry rather than browser zoom. The square hero media was expanding the desktop hero to roughly 792 px, while adjacent sections each contributed large top and bottom padding, producing about 168 px between content groups. Narrow carousel percentages then made the cards appear smaller again.

Corrections applied:

- Desktop content container calibrated to 1320 px with 32 px gutters; mobile gutters are 16 px.
- Desktop hero is constrained to 590 px and retains the 40/60 copy/media composition.
- Adjacent section padding now produces about 80 px desktop and 56 px mobile content separation.
- Product, concern, demonstration, review, guide, newsletter, and footer dimensions were enlarged to match the reference density.
- Mobile trust items stay in one row; concerns and quiz answers use 2-by-2 grids; product, demonstration, and review rails expose the intended next-card peek.
- Quiz answers no longer auto-advance. Each step has an explicit disabled-until-selected Next button, Back navigation, retained selections, and a final result CTA.
- Review copy remains real Judge.me data. When no genuine customer media exists, the cards use a neutral configurable placeholder instead of repurposing product photography as testimonial UGC.
- Newsletter privacy copy is configurable and rendered below the form.

Final scale screenshots:

- `tmp/screenshots/final-scale/homepage-375.png`
- `tmp/screenshots/final-scale/homepage-1440.png`
- Additional captures: 320, 390, 768, 1024, 1280, and 1600 px.

QA was repeated from 320 through 1920 px: no horizontal overflow, zero missing image alt attributes, zero unnamed buttons, and the quiz, FAQ, video modal, mobile drawer, search/cart controls, and newsletter controls all passed. Theme Check completed with zero errors; its warnings are pre-existing style/static-analysis findings in the base theme plus one remote Shopify-hosted video source warning.

## 18. Strict fidelity continuation (2026-08-05)

- Added shared page-width, responsive gutter, display, heading, body, and radius tokens for the approved visual scale.
- Desktop now renders exactly four complete primary product cards; mobile cards use a 46vw rail with intentional next-card reveal.
- Hero focal-point and mobile gradient controls now drive the rendered CSS rather than existing only in schema.
- Mobile Why Altaeron is restored to the approved three-column composition.
- Demonstration blocks now support an individual Shopify video, poster, external video URL, optional link, label, and accessibility label. A single lazy modal player swaps the selected source on demand.
- Testimonials now render as configurable media cards. Priority is merchant video/image, then contextual reviewed-product media, with real Judge.me quote/name/rating data. No synthetic customer imagery, identity, persona, verified status, rating, or review total was added.
- Removed the neutral quote placeholder UI and corrected empty/broken review-media fallback behavior.
- Final responsive QA covers 320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440, 1600, and 1920 px with no page-level horizontal overflow.

Strict-fidelity screenshots:

- `tmp/screenshots/fidelity-final-v2/homepage-375.png`
- `tmp/screenshots/fidelity-final-v2/homepage-1440.png`

