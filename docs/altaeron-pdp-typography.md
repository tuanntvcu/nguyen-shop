# Altaeron PDP typography system

The PDP typography is scoped to `.section-altaeron-pdp`; it does not alter the announcement bar, header, footer, or other templates. The active theme family (`--font-body-family`, DM Sans in the current theme settings) is used for every PDP text role.

## Audit baseline

Before normalization, the hero used Georgia at 35px in the base rule and a different theme face at wide desktop; the purchase title was 23px with `!important`; section titles ranged from 20px to 26px; and the two numbered chapter systems used 43px/34px editorial badges for chapters 1–3, a bespoke pill for chapter 4, and 28px/25px tail badges for chapters 5–12. The expert block also introduced Georgia, Brush Script, and Segoe Script.

Meaningful desktop and mobile text fell below the requested readability floor in multiple roles: purchase rating 11px, payment copy 11px, trust support 8.5px, review copy 12–13px, comparison cells 10–12px, card copy 9–12px, FAQ answers 10px, final CTA fine print 8–10px, and sticky purchase metadata 7.5–10px. Weight values of 650, 750, 800, and 900 were used across labels, prices, cards, and badges. Letter spacing and capitalization also varied by component, while some headings relied on forced line breaks.

## Reusable tokens

Desktop values at 1440px:

| Token | Value |
| --- | ---: |
| `--alta-type-display-xl` | 48px |
| `--alta-type-display-lg` | 28px |
| `--alta-type-heading-xl` | 28px |
| `--alta-type-heading-lg` | 24px |
| `--alta-type-heading-md` | 20px |
| `--alta-type-heading-sm` | 16px |
| `--alta-type-body-lg` | 18px |
| `--alta-type-body-md` | 16px |
| `--alta-type-body-sm` | 14px |
| `--alta-type-caption` | 13px |
| `--alta-type-price` | 32px |
| `--alta-type-button` | 16px |
| `--alta-type-label` | 14px |

The system also centralizes `--alta-leading-display`, `--alta-leading-heading`, `--alta-leading-body`, `--alta-leading-compact`; regular/medium/semibold/bold weights (400/500/600/700); display/heading/label tracking; and primary/secondary/muted/positive/negative text colors.

At 375px, the responsive tokens set display to 38px, section headings to 24px, price to 30px, and retain 16px body copy. Tablet display and section heading values are 42px and 26px.

## Standard components

All numbered chapters 1–12 render the `altaeron-pdp-section-heading` snippet and use `.alta-pdp-section-heading`, `.alta-pdp-section-heading__number`, `.alta-pdp-section-heading__title`, and `.alta-pdp-section-heading__subtitle`. Desktop badges are 32px with 15px numerals; mobile badges are 28px with 14px numerals. Titles, subtitle spacing, color, baseline treatment, and content spacing are shared.

The same scale now covers the hero, purchase title, price and savings, variant controls, CTAs, trust items, expert credentials and quote, content cards, lists, reviews, comparison table, education cards, FAQ, final CTA, and mobile sticky purchase bar. Judge.me overrides are narrowly scoped below `.altaeron-pdp` and affect only font inheritance, review body copy, author names, and buyer badges.

## QA contract

Typography QA is run at 1440, 1280, 1024, 768, 430, 390, and 375px. Required checks are: no horizontal overflow, no clipping or overlap, readable comparison/FAQ/review copy, centered CTA labels, consistent chapters 1–12, deliberate heading wraps, and no changes to global chrome or PDP section order.

## Final QA result

The development theme rendered HTTP 200 with zero page errors and `scrollWidth === clientWidth` at all seven target widths. Full-page screenshots were visually inspected at 1440px and 375px.

Computed reference styles at 1440px: hero 48/52.8/700, product title 24/30/700, price 32/32/700, all twelve chapter titles 28/33.6/700, all chapter badges 32px with 15/700 numerals, chapter subtitles 16/24/400, FAQ questions 15/21/600, FAQ answers 15/24/400, and final heading 28/33.6/700.

Computed reference styles at 375px: hero 38/41.04/700, product title 20/25/700, price 30/30/700, all twelve chapter titles 24/28.8/700, all chapter badges 28px with 14/700 numerals, chapter subtitles 15/22.5/400, FAQ questions 15/21/600, FAQ answers 15/24/400, and final heading 24/28.8/700. The automated meaningful-text scan found no visible PDP text below 12px at either reference width.
