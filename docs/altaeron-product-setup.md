# Altaeron product template

## Architecture inspected

The implementation extends Palo Alto instead of replacing its commerce layer.

- `sections/main-product.liquid`: native product section, structured data, media/model setup, and Theme Editor block patterns.
- `snippets/product-information-blocks.liquid`: native app-block, variant-picker, buy-button, inventory, pickup, accordion, and complementary-product integration.
- `snippets/product-media-gallery.liquid`, `snippets/product-thumbnail.liquid`, and `assets/media-gallery.js`: image, video, external video, 3D, thumbnails, pagination, keyboard controls, zoom hooks, and variant-media behavior.
- `snippets/product-variant-picker.liquid`, `snippets/product-variant-options.liquid`, `assets/variant-selects.js`, and `assets/product-info.js`: option-value availability, Shopify swatches, deep-linked variants, section rendering, price/inventory/URL/media updates.
- `snippets/buy-buttons.liquid`, `snippets/quantity-input.liquid`, `assets/theme.js`, `assets/cart.js`, and `sections/cart-drawer.liquid`: product forms, quantity rules, dynamic checkout, add-to-cart state, errors, cart drawer, and theme events.
- `sections/related-products.liquid`, `assets/product-recommendations.js`, and `snippets/card-product.liquid`: recommendations API and real product card behavior.
- `sections/sticky-atc-bar.liquid`, `assets/sticky-atc-bar.js`, `sections/collapsible-tabs.liquid`, and `assets/collapsible-tabs.js`: native sticky purchase and accordion conventions.

## Files added

- `templates/product.altaeron.json`
- `sections/altaeron-product-experience.liquid`
- `sections/altaeron-product-aftercare.liquid`
- `sections/altaeron-product-guide.liquid`
- `sections/altaeron-other-worlds.liquid`
- `snippets/altaeron-chapter-nav.liquid`
- `snippets/altaeron-trust-items.liquid`
- `snippets/altaeron-related-world-card.liquid`
- `assets/altaeron-product.css`
- `assets/altaeron-product.js`
- `docs/altaeron-product-setup.md`

No existing Palo Alto file is modified by this feature. The template only loads Altaeron assets when assigned to a product.

## Product metafield definitions

Create these definitions in **Settings > Custom data > Products**. Namespace/key values must match exactly.

| Namespace and key | Shopify type | Use |
| --- | --- | --- |
| `custom.world_label` | Single line text | Hero world/chapter label |
| `custom.product_eyebrow` | Single line text | Hero category eyebrow |
| `custom.short_story` | Multi-line text | Concise hero story |
| `custom.legend_heading` | Single line text | Lore heading |
| `custom.legend_content` | Rich text | Full product legend |
| `custom.legend_signature` | Single line text | Editorial signature |
| `custom.legend_image` | File reference (image) | Lore media fallback |
| `custom.legend_video` | File reference (video) | Preferred lore media |
| `custom.realm_name` | Single line text | Reserved product-world metadata |
| `custom.origin` | Rich text or multi-line text | Reserved origin metadata |
| `custom.guardian` | Single line text | Reserved guardian metadata |
| `custom.elements` | List of single line text | Reserved material/element data |
| `custom.detail_gallery` | List of file references (images) | Macro-detail gallery |
| `custom.lifestyle_gallery` | List of file references (images) | Homes of Altaeron gallery |
| `custom.packaging_image` | File reference (image) | Packaging feature |
| `custom.packaging_heading` | Single line text | Packaging heading |
| `custom.packaging_content` | Rich text | Merchant-authored packaging facts |
| `custom.care_content` | Rich text | Care introduction |
| `custom.story_card` | Metaobject reference (`altaeron_customer_story`) | Optional editorial story |
| `custom.related_realm` | Collection reference | Primary related-product source |
| `custom.light_modes` | List of single line text | Optional editorial mode labels; commerce selectors still come from variants |
| `custom.light_mode_descriptions` | JSON or list of `altaeron_light_mode` references | Optional supporting mode content |
| `custom.size_guide_page` | Page reference | Product-specific size-guide link |
| `custom.delivery_note` | Single line text | Product-specific factual delivery note |
| `custom.craft_steps` | List of metaobject references (`altaeron_craft_step`) | Craft journey |
| `custom.product_faqs` | List of metaobject references (`altaeron_product_faq`) | Product FAQs |
| `custom.featured_review` | Metaobject reference (`altaeron_customer_story`) | Optional editorial customer story |
| `custom.world_number` | Single line text | Fallback world number |
| `custom.artifact_details` | Rich text | Macro-gallery introduction |
| `custom.story_video_poster` | File reference (image) | Reserved custom poster |

The template also reads Shopify's standard `reviews.rating` and `reviews.rating_count` metafields. Define/populate those through the installed review provider; do not enter invented aggregates.

## Metaobject definitions

Create these in **Settings > Custom data > Metaobjects**.

### `altaeron_craft_step`

| Field key | Type | Required |
| --- | --- | --- |
| `number` | Single line text | No |
| `title` | Single line text | Yes |
| `description` | Multi-line text | No |
| `image` | File reference (image) | No |
| `video` | File reference (video) | No |
| `icon` | File reference | No |
| `accessibility_label` | Single line text | No |

### `altaeron_product_faq`

| Field key | Type | Required |
| --- | --- | --- |
| `question` | Single line text | Yes |
| `answer` | Rich text | Yes |

### `altaeron_customer_story`

| Field key | Type | Required |
| --- | --- | --- |
| `customer_name` | Single line text | Yes |
| `customer_location` | Single line text | No |
| `quote` | Multi-line text | Yes |
| `images` | List of file references (images) | No |
| `avatar` | File reference (image) | No |
| `verified` | Boolean | No |
| `rating` | Integer | No |

### Optional `altaeron_light_mode`

| Field key | Type |
| --- | --- |
| `name` | Single line text |
| `description` | Multi-line text |
| `icon` | File reference |
| `preview_image` | File reference (image) |
| `variant_value` | Single line text |

`variant_value` is editorial linkage only. The purchasable Light Mode controls always render from `product.options_with_values` and Shopify variants.

## Shopify Admin setup

1. Add the product metafield and metaobject definitions above.
2. Create craft-step, FAQ, and optional customer-story entries.
3. Open each product and populate only the applicable fields. Empty optional fields collapse cleanly.
4. Configure actual product options and variants for Size, Base/Material/Finish, Light Mode, or any other merchant terminology. The template does not assume fixed option names.
5. Add swatches through Shopify category/native swatch data, or configure Palo Alto's global swatch mapping. Variant-image and text fallbacks remain available in the section settings.
6. Add product images, Shopify videos, external videos, or 3D models to the normal Shopify product media area.
7. In the theme editor, open a product using the Altaeron template and configure global labels, colors, trust statements, motion, thumbnails, zoom, dynamic checkout, and app blocks.
8. Add the installed review app's product widget as an app block inside **Altaeron story & reviews**. Add any rating badge app block to **Altaeron product** if the provider requires it.
9. Enter shipping, returns, and warranty trust claims only after confirming the store policies. They intentionally default to blank.

## Assigning the template

1. Go to **Products** in Shopify Admin.
2. Open a product.
3. In **Theme template**, choose **altaeron** (Shopify displays the suffix, not the full filename).
4. Save and preview the product.
5. Repeat or bulk-edit the theme template for additional products.

## Fallback behavior

- Product eyebrow: first product collection title.
- Short story: plain-text, safely truncated product description.
- World label: `custom.world_label`, then `custom.world_number`, then first collection title.
- Legend media: video, then image, otherwise the media region is omitted.
- Legend content: rich-text metafield, then short-story text.
- Craft journey: omitted when `custom.craft_steps` is empty.
- Detail gallery: product media after the primary media when `custom.detail_gallery` is empty.
- Lifestyle gallery: omitted when empty.
- Packaging: omitted when all packaging fields are empty.
- Reviews: standard rating and count only when populated; optional editorial story/app blocks otherwise. No synthetic rating is rendered.
- FAQs: product metaobjects take priority; merchant-configured global section blocks are the fallback; the section is omitted if both are empty and care content is empty.
- Related products: related-realm collection, then Shopify recommendations, then first relevant product collection excluding the current product.
- Single default variant: native variant controls are omitted.
- Compare-at price/sale badge: native price snippet only shows sale state for a valid compare-at price greater than the selected price.
- Light mode: only appears when it is a real product option.
- Trust claims: omitted until configured by the merchant.

## QA status

Static checks completed:

- Template JSON parses successfully.
- Altaeron JavaScript passes `node --check`.
- Shopify Theme Check completes successfully across all 291 files with zero errors. Its 36 warnings are pre-existing variable-naming warnings in four unrelated Palo Alto snippets: `country-selector.liquid`, `language-selector.liquid`, `mega-menu.liquid`, and `menu-drawer-details.liquid`. No Altaeron file is reported.
- `git diff --check` reports no Altaeron whitespace errors.
- No product title, product price, product media, variant value, rating, review count, URL, inventory, or related product is hardcoded.
- Core purchasing remains a Shopify `{% form 'product' %}` with Palo Alto's `is="product-form"` behavior and cart events.
- Variant selection remains Palo Alto's native section-rendering flow and option-value API.
- Only the LCP media is eager/high priority through the existing product-thumbnail implementation; lower product and story media are lazy loaded.
- Reduced motion, focus-visible states, semantic headings, native details/summary, live price/inventory regions, safe-area padding, and touch target sizing are included.

Runtime QA that must be completed against a connected Shopify development store:

- Deep-linked, sold-out, unavailable, one-variant, many-variant, and quantity-rule products.
- Add to cart, cart drawer, dynamic checkout, payment terms, pickup availability, Markets currency, and cart errors.
- Images, hosted video, external video, 3D, zoom, media pagination, swipe, and keyboard navigation.
- Review provider app blocks and any subscription/selling-plan app block used by the store.
- Recommendations API, empty recommendation fallback, and collection override.
- Theme Editor section reload/reorder behavior.
- Browser/device passes at 320, 360, 375, 390, 414, 768, 1024, 1280, 1440, and 1920 pixels; landscape mobile; 200% zoom; and short viewports.
- Lighthouse/Web Vitals against production-like product media and installed apps.

## Known limitations and screenshot status

- This checkout contains no persisted Shopify store target or product/metafield fixture set. An existing local Shopify process was found on port 9292, but it is not serving this checkout's new Altaeron template; taking over that session could disrupt separate in-progress theme work. Liquid therefore cannot be rendered faithfully into final screenshots from the current session. Capture the requested 1440 px and 390 px screenshots after connecting this checkout to a safe development-theme session and assigning/populating the template.
- Palo Alto in this checkout has no native selling-plan selector in its product snippets. Subscription/selling-plan products should use the provider's theme app block inside the native product form area, then be verified with that provider.
- The static references contain product-specific art and copy that are not theme assets. Pixel matching of crops and section heights depends on entering the approved product media/metafields and configuring the actual header/footer.
- The custom sticky mobile bar delegates to the native product form. It is intentionally hidden until the primary purchase form has fully scrolled above the viewport and is disabled whenever the native submit is disabled.

## Screenshot capture

With Shopify CLI authenticated and the product assigned:

1. Run `shopify theme dev --store your-development-store.myshopify.com`.
2. Open the Altaeron product preview URL from the CLI.
3. Capture a full-page desktop screenshot at a 1440 px viewport.
4. Capture a full-page mobile screenshot at a 390 px viewport with device scale factor 1.
5. Compare typography, header height, real image focal points, gallery crop, variant count wrapping, app-widget dimensions, and footer content against the approved references.
