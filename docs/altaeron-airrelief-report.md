# Altaeron AirRelief implementation

Live page: https://altaeron.com/products/airrelief-foot-ankle-massager

Product ID: 8052528480317. Updated on October 7, 2026 (Asia/Saigon).

Update: at the owner's request, temporary DialFit images/videos are now assigned to AirRelief so the layout can be reviewed before replacement. Hero uses DialFit's hero video, story and mechanism use corresponding source images, comparison has two images, the session section has one video and four images, and the final CTA has its source image. These are editable AirRelief section settings; DialFit remains unchanged. The hero video fallback uses AirRelief's own `altaeron.massager_preview_hero_video` file-reference metafield and can be switched off with “Use temporary hero video when no video selected.” Select a replacement hero video to override it. Reviewer identity and portrait remain neutral.

This preview-media request supersedes the original requirement to omit all imagery from other products. Images may currently depict or contain wording about DialFit; replace them with AirRelief media before using the page as finalized campaign creative. Original text-only QA evidence below predates this requested temporary imagery.

Preview media QA: checked live at 375, 768 and 1440 pixels. Both videos loaded successfully; story/mechanism images, two comparison images, four session images and final CTA image rendered without broken media, page overflow, Liquid errors or JavaScript page errors. Theme Check reports no offenses for the massager section/template. Evidence: `tmp/airrelief-audit/preview-media-qa.json` and `preview-media-*.png`. Added `scripts/prepare-airrelief-preview-media.mjs` and `scripts/qa-airrelief-preview-media.mjs` for this update.

| Item | Result |
| --- | --- |
| Template | `product.altaeron-massager.json`; suffix `altaeron-massager` assigned |
| Product title | Altaeron™ AirRelief Foot & Ankle Massager |
| Vendor / type | Altaeron / Foot & Ankle Massager |
| Handle | `airrelief-foot-ankle-massager` |
| Price / compare-at | USD 49.95 / USD 69.95; existing variant and inventory preserved |
| SEO title | Foot & Ankle Massager with Heat & Compression \| Altaeron |
| SEO description | Relax tired, heavy feet in 15 minutes with Altaeron AirRelief. Air compression, warming heat and vibration deliver cordless foot and ankle massage at home. |
| Purchase | Hidden quantity 1, no bundle widget, dynamic variant price and availability |
| Campaign | Existing Labor Day snippet and countdown mechanics retained; AirRelief CTA retained |
| First-order offer | Existing 5% copy and WELCOME checkout redirect retained |
| Medical Review | Isolated matching panel with neutral attribution; review explicitly pending |
| Reviewer identity | No reused doctor identity or portrait. Name, credentials, portrait, body and verified-permission checkbox editable in theme settings |
| Configuration | 3 compression cycles, 5 intensity levels, 4 heat levels, 4 vibration levels throughout copy |
| Reviews | Judge.me configured for this product only. Zero current reviews; review section and ratings hidden until legitimate reviews exist |
| Redirect | Original supplier handle redirects to the new URL |
| Publication | Product was ACTIVE but absent from Online Store. Published to Online Store; other channel assignments retained |

Created storefront files:

- `templates/product.altaeron-massager.json`
- `sections/altaeron-pdp-massager.liquid`
- `assets/altaeron-pdp-massager.css`
- `assets/altaeron-pdp-massager.js`

Created supporting files: `scripts/airrelief-store.mjs`, `scripts/build-airrelief.mjs`, `scripts/deploy-airrelief.mjs`, `scripts/inspect-airrelief.mjs`, `scripts/publish-airrelief.mjs`, `scripts/push-airrelief-files.mjs`, `scripts/qa-airrelief.mjs`, `scripts/verify-airrelief.mjs`, and this report. Scripts obtain credentials from environment variables; credentials are not written into source files. `.gitignore` now excludes local AirRelief audit output.

Shopify fields changed: title, handle, vendor/type, branded description, SEO title/description, template suffix, existing image alt text and Online Store publication. Product metafields were inspected and retained; section settings hold massager-specific configuration. No existing theme source file was changed. Remote checksums of the original DialFit template/section, common PDP assets, English locale and audited reusable snippets match their pre-deployment values. DialFit product title, handle and template assignment remain intact.

Media: the existing supplier image prints “5 Levels Heating,” conflicting with the requested configuration. Its media ID is excluded from this PDP through an editable setting; the file is retained in Shopify. Hero, story, mechanism and final CTA media settings are ready. New product media is picked up dynamically, except the excluded image. Empty media areas collapse. No supplier images were downloaded or hard-coded. The existing image may still appear in other store components that use product media directly.

Localization: new product copy uses English source text without translation-key lookups; shared campaign, offer and system strings retain existing translations. No unrelated locale files changed. German, Spanish, French, Japanese and Portuguese translations of the new AirRelief copy remain to be added/reviewed; the new copy currently remains English on localized pages.

Validation:

- Live browser checks at 375, 768 and 1440 pixels: HTTP 200, no horizontal page overflow, no broken images and no JavaScript page errors.
- 13 FAQ accordions render and open. Comparison scrolls within its own region on small screens.
- Countdown changes each second; Labor Day campaign and 5% first-order UI render.
- Main and final CTA add product 8052528480317 with quantity 1 in disposable browser sessions. Cart drawer is open after adding; checkout uses `/discount/WELCOME?redirect=%2Fcheckout`.
- SEO title, description and canonical match the new product URL.
- Shopify-generated product JSON-LD uses the AirRelief title, USD 49.95 and InStock. No fabricated aggregate rating.
- No customer-facing stale product references, bundle copy or conflicting heat/vibration counts in the new PDP copy.
- Shopify Theme Check reports no offenses for the new massager files. The repository-wide command also reports pre-existing offenses in unrelated files.
- No Liquid errors in the live response. Original product handle redirect verified.

Remaining: add finalized product images; confirm the physical product matches the user-specified configuration; add reviewed translations; supply a verified medical reviewer if a named endorsement is desired. Checkout discount routing was tested, but customer eligibility, discount stacking and completed-payment behavior were not tested. No order was placed.

Local backups and QA evidence: `tmp/airrelief-audit/` (ignored by Git).
