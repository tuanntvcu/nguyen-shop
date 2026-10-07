# Altaeron AirRelief implementation

Live page: https://altaeron.com/products/airrelief-foot-ankle-massager

Product ID: 8052528480317. Updated on October 7, 2026 (Asia/Saigon).

Update: at the owner's request, temporary DialFit images/videos are now assigned to AirRelief so the layout can be reviewed before replacement. Hero uses DialFit's hero video, story and mechanism use corresponding source images, comparison has two images, the session section has one video and four images, and the final CTA has its source image. These are editable AirRelief section settings; DialFit remains unchanged. The hero video fallback uses AirRelief's own `altaeron.massager_preview_hero_video` file-reference metafield and can be switched off with “Use temporary hero video when no video selected.” Select a replacement hero video to override it. Reviewer identity and portrait remain neutral.

This preview-media request supersedes the original requirement to omit all imagery from other products. Images may currently depict or contain wording about DialFit; replace them with AirRelief media before using the page as finalized campaign creative. Original text-only QA evidence below predates this requested temporary imagery.

Preview media QA: checked live at 375, 768 and 1440 pixels. Both videos loaded successfully; story/mechanism images, two comparison images, four session images and final CTA image rendered without broken media, page overflow, Liquid errors or JavaScript page errors. Theme Check reports no offenses for the massager section/template. Evidence: `tmp/airrelief-audit/preview-media-qa.json` and `preview-media-*.png`. Added `scripts/prepare-airrelief-preview-media.mjs` and `scripts/qa-airrelief-preview-media.mjs` for this update.

Purchase trust update: at the owner's request, the block under the purchase button now copies DialFit's four icons, translated labels, secondary lines and policy links: FREE SHIPPING / On every order; 30-DAY GUARANTEE / Try it risk-free; SECURE CHECKOUT / Encrypted payment; TRACKED DELIVERY / Follow your order. AirRelief uses a 2×2 layout on desktop and mobile to match the supplied reference. The social-proof line now uses DialFit's existing deterministic daily-count function (20–30); this is a generated marketing number, not a measured count from Shopify orders. DialFit and the existing preview-media template settings were not changed. Added `scripts/update-airrelief-trust.mjs`; evidence is in `tmp/airrelief-audit/trust-qa.json` and `trust-*.png`.

Design-fidelity update (UX/UI only): AirRelief now loads the original shared `altaeron-pdp.css`, uses the actual `apdp-dialfit-*` structures/classes, and retains only a small dedicated stylesheet for content-shape exceptions. The existing numbered-heading snippet is reused unchanged. The live DialFit section's exact section-ID-scoped rules are cloned into the AirRelief section, with unused size-dialog, testimonial, gallery-story and generic-card rules omitted. The old 946-line massager stylesheet, `airrelief-two`, custom expert grid, generic card system, global table overrides and independent final-CTA spacing were removed.

The first story is the exact media-first two-column/mobile stack from DialFit: tinted background, the same media aspect/radius/shadow, numbered heading inside the copy column, selective green emphasis on the existing words “15 Minutes Back.” and matching paragraph styles. Mechanism uses DialFit's actual support-state cells and media/text composition. Benefits and controls use the benefits grid; use cases use the actual icon/card/panel classes; how-to and the 15-minute progression use the animated step component with three items. Comparison and specifications use the source comparison row/cell styles; FAQ, Medical Review, guarantee and final sales block use their source markup patterns. The final sales block also uses the existing payment-icon treatment and presents the unchanged Compression/Heat/Vibration wording in the source's three-item benefit pattern.

Necessary differences: AirRelief retains five comparison columns and horizontal scrolling, three therapies and three steps, the verified-reviewer conditional and neutral portrait, and its current lack of use-case artwork. The final seal contains a neutral shield rather than new guarantee wording. Intrinsic line wrapping, price glyph width and guarantee CTA width differ with the unchanged AirRelief copy. Comparison's 24px top gap sits on the scroll wrapper rather than the inner table. No product imagery, section order, content, pricing, SEO, translations, product fields, campaign/discount behavior or purchase/review JavaScript was changed.

Visual QA completed at 375, 768, 1024 and 1440px, with both pages captured at 375/768/1440px for ATF, story, mechanism, benefits, comparison, Medical Review, FAQ and final CTA. Compared computed typography, colors, padding, margins, radius, widths, grids and media aspect rules. The shared style values match; remaining dimension differences are those described above. No page overflow, Liquid errors, missing translations or JavaScript page errors occurred in the final checks. Static word inventories are equal for all 18 existing sections, and the section schema is unchanged. Shopify Theme Check reports no offenses for the new section. Original shared/DialFit files, both product templates, locale and JavaScript checksums are unchanged; Shopify product data before/after is identical.

Files for this update: `sections/altaeron-pdp-massager.liquid`, `assets/altaeron-pdp-massager.css`, `scripts/build-airrelief.mjs`, this report, and new `scripts/audit-airrelief-design.mjs`, `scripts/map-airrelief-design.mjs`, `scripts/refine-airrelief-design.mjs`, `scripts/deploy-airrelief-design.mjs`, `scripts/qa-airrelief-design.mjs`. The build entry now delegates to the design refinement and preserves the audited copy/schema instead of rebuilding the former design. Evidence and the exact visual style map: `tmp/airrelief-audit/design/`.

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
