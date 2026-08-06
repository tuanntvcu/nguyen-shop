# Altaeron reusable PDP — implementation report

Generated: 2026-08-05  
Store: `i9f8uv-gq.myshopify.com` / `altaeron.com`  
Production theme: `nguyen-shop/main` (`140538314813`)  
QA theme: `Development (771095-DESKTOP-B231O49)` (`140844204093`)

## 1. Files created

- `snippets/altaeron-pdp-card.liquid`
- `snippets/altaeron-pdp-icon.liquid`
- `snippets/altaeron-pdp-media.liquid`
- `scripts/audit-pdp-store.mjs`
- `scripts/populate-pdp-data.mjs`
- `scripts/deploy-pdp-theme.mjs`
- `scripts/qa-pdp.mjs`
- `scripts/qa-pdp-cart.mjs`
- `scripts/audit-pdp-cleanup.mjs`
- `docs/altaeron-pdp-report.md`

## 2. Files modified

- `sections/altaeron-pdp.liquid` — replaced the hardcoded single-product layout with the shared dynamic PDP.
- `assets/altaeron-pdp.css` — PDP-scoped responsive design matching the supplied information hierarchy.
- `assets/altaeron-pdp.js` — accessible gallery, variant/price synchronization, quantity, video loading, and mobile sticky ATC.
- `templates/product.altaeron.json` — one reusable section with global editor settings only.
- `scripts/product-media-contact-sheet.mjs` — accepts the current PDP audit snapshot.

No header, footer, announcement-bar, navigation, cart-drawer, or global layout file was changed by this PDP work.

## 3. GraphQL and deployment scripts

- `audit-pdp-store.mjs`: read-only store/product/definition/theme/Judge.me/file inventory.
- `populate-pdp-data.mjs`: dry-run by default; `--apply` creates definitions/metaobjects, populates fields, and assigns the template idempotently.
- `deploy-pdp-theme.mjs`: backs up and upserts only the seven PDP theme files.
- Pre-population data backup: `tmp/pdp-audit/pre-population-backup.json`.
- Production theme backup: `tmp/pdp-audit/theme-before-140538314813/`.
- Cleanup dry run: `tmp/pdp-audit/cleanup-dry-run.json`.

## 4. Metafield definitions created

Namespace: `altaeron`.

- Presentation: `pdp_eyebrow`, `pdp_headline`, `pdp_subheadline`, `pdp_identity_points`, `pdp_cta_label`.
- Familiarity: `pdp_pain_heading`, `pdp_pain_intro`, `pdp_pain_cards`, `pdp_reassurance`.
- Video/outcomes: `pdp_video`, `pdp_video_heading`, `pdp_video_text`, `pdp_outcome_cards`.
- How-to: `pdp_how_heading`, `pdp_how_intro`, `pdp_how_steps`, `pdp_how_image`, `pdp_usage_tip`.
- Lifestyle/routine: `pdp_lifestyle_heading`, `pdp_lifestyle_intro`, `pdp_lifestyle_cards`, `pdp_routine_heading`, `pdp_related_products`.
- Safety/FAQ: `pdp_usage_notes`, `pdp_safety_note`, `pdp_disclaimer`, `pdp_faq_heading`, `pdp_faq_items`.
- Compatibility/guides: `pdp_compatibility_heading`, `pdp_compatibility_items`, `pdp_guides_heading`, `pdp_guide_cards`.

There are 32 new definitions. Shopify's 50-pinned-definition limit was reached, so later fields remain unpinned but fully editable and available to Liquid.

## 5. Metaobject definitions created

- `altaeron_pdp_card`: title, text, image, icon key, URL, link label.
- `altaeron_pdp_step`: number, title, instructions, image.
- `altaeron_pdp_faq`: question and answer.

166 product-specific metaobjects were upserted using stable handles, so re-running the script updates rather than duplicates them.

## 6. Products updated

All seven active products received 29 populated PDP fields and the `altaeron` template:

- Adjustable Bunion Corrector
- Ankle Support with Side Stabilizers
- Breathable Bunion Support
- Day & Night Bunion Corrector
- Electric Foot & Hand Massager
- Plantar Fasciitis Night Splint Sock
- Rotating Toe Alignment Support

## 7. Products skipped

None.

## 8–10. Metafield migration and cleanup

- Migrated: none; original descriptions and existing metafields were preserved.
- Deleted: none.
- Cleanup audit: 80 product definitions inspected; 52 retained because of code references, populated data, or app ownership; 28 unpopulated/unreferenced definitions remain manual-review candidates.
- Existing populated `altaeron` fields were retained for rollback rather than deleted automatically.
- Judge.me, app-owned, reviews, Google, Swym, Klaviyo, and theme-owned namespaces were protected.

## 11. Judge.me integration

- Hero rating/count reads `product.metafields.judgeme.review_widget_data.value`.
- Review cards use the real reviews array exposed by that metafield.
- The standard `product.metafields.judgeme.widget` remains rendered for full widget compatibility.
- Products with zero reviews hide the review section; no testimonials, counts, verified labels, or portraits are fabricated.
- Current real counts: Electric Foot & Hand Massager 15; Plantar Fasciitis Night Splint Sock 7; other products 0.

## 12. Temporary video

The approved Shopify file resolved to `gid://shopify/Video/27758272446525`, status `READY`, with three CDN sources. It is referenced once through the existing shop metafield `custom.homepage_demo_video`; no admin URL is rendered and no duplicate upload was made. A product's `altaeron.pdp_video` overrides it automatically.

## 13. Responsive QA

- Tested all seven products at 1440×1000 and 375×812 (14 pages total).
- All 14 rendered the reusable PDP.
- No horizontal overflow.
- Mobile remains a single continuous column.
- Desktop uses the intended wide gallery / narrative / purchase-card structure.
- Full-page and hero captures are in `tmp/pdp-qa/`.

## 14. Functional QA

- Variant switching: passed for radio and select presentations.
- Variant URL update: passed.
- Price, compare-at price, and savings update: passed.
- Gallery switching and variant media activation: passed.
- Quantity controls: initialized and included in the native product form.
- Native cart form/cart drawer: `/cart/add` returned 200 and contained the selected product.
- Mobile sticky ATC: appeared after the primary CTA left the viewport and added successfully.
- FAQ disclosure behavior and keyboard semantics: rendered with native `details/summary`.
- Theme Editor reload hook: implemented.
- Zero PDP page errors in the final development and production runs.
- Four preview console messages come from the Shop Pay iframe CSP/403 behavior, not PDP assets.

## 15. Performance considerations

- First product image is eager/high-priority and dimensioned through Shopify CDN transformations.
- Remaining gallery images are lazy-loaded.
- Videos use `preload="none"`, controls, muted placeholder playback, and `playsinline`.
- Below-fold images use responsive `srcset`/sizes.
- CSS and JS are loaded only by the Altaeron PDP section.
- PDP selectors are namespaced; the only native sticky suppression is scoped to pages containing `.altaeron-pdp` to prevent duplicate ATC bars.

## 16. Remaining manual tasks

- Replace the shared temporary fantasy video with product-specific demonstrations.
- Add product-specific lifestyle photography if available; current cards use real product media only.
- Review the 28 cleanup candidates in `cleanup-dry-run.json` before any future deletion.
- The store's refund/shipping policy pages still contain legacy lamp-brand language. The PDP links to those real policies and makes no unsupported 30-day or delivery-speed claim; policy copy should be reviewed separately.
- Product data for several supplier-imported listings is verbose and inconsistent. The PDP copy is conservative, but supplier manuals should remain the source for exact operating limits.

## 17. Replacing placeholder videos

1. In Shopify Admin, open the product.
2. In its metafields, find **PDP lifestyle video** (`altaeron.pdp_video`). Unpinned fields may appear under “View all”.
3. Select or upload the product-specific Shopify-hosted video and save.
4. The product-specific video immediately overrides `custom.homepage_demo_video`; clearing it restores the shared fallback.
5. Do not paste a Shopify Admin URL into content. Always select the file through the file-reference field.

## Deployment and QA result

The same seven PDP files were deployed to the development theme and the production MAIN theme after separate backups. Final production QA: 14/14 pages visible, zero overflow failures, zero page errors, zero variant failures, and sticky add-to-cart passed.
