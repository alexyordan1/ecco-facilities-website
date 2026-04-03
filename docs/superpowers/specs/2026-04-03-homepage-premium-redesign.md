# Homepage Premium Redesign — Design Spec

**Date:** 2026-04-03
**Page:** index.html
**Site:** eccofacilities.com (Cloudflare Pages, auto-deploy from GitHub)
**CSS version:** v3.4 → v3.5 after this work
**JS version:** v1.4 → v1.5 after this work

## Summary

Full restructure of the homepage from 11 sections to 12, replacing 2 overlapping sections ("The Ecco Standard" + "The Ecco Difference") with a unified "Before/After Ecco" comparison, adding 5 entirely new components, upgrading 2 existing sections, and extracting all 16 inline styles to CSS classes. The narrative follows a Trust-First Funnel: lead with credibility, educate, convert.

## Decisions Log

| Decision | Choice | Alternatives Considered |
|----------|--------|------------------------|
| Strategy | Restructure & Elevate | Polish & Consolidate, Services-Level Parity |
| Narrative flow | Trust-First Funnel | Problem-Solution Arc, Show-Don't-Tell |
| Before/After format | Side-by-side columns | Tabbed comparison, Feature checklist table |
| CTA format | Enhanced Banner + dual CTA (proposal + email) | Split layout with inline form |

## New Page Flow

```
1.  Hero + Hero Stats (animated counters)         — REDESIGN   — navy gradient
2.  Featured Testimonial (big quote)              — NEW        — cream
3.  Certification Badges (horizontal strip)       — NEW        — white
4.  What We Do (2 service cards)                  — KEEP+POLISH— cream
5.  Before/After Ecco (side-by-side red/green)    — NEW        — white
6.  Trust Strip (3 client quotes)                 — NEW        — cream
7.  How It Works (3 steps)                        — KEEP+POLISH— white
8.  Industries Showcase (expandable cards)        — REDESIGN   — cream
9.  Safe for Everyone (6 cards)                   — KEEP       — navy
10. Video/Visual Story (photo gallery)            — NEW        — white
11. FAQ (6 items)                                 — KEEP       — cream
12. Premium CTA (enhanced banner + email)         — REDESIGN   — navy
```

### Sections Removed

- **"The Ecco Standard"** (old section 4, `.problem-sec`) — 6 value props absorbed into Before/After
- **"The Ecco Difference"** (old section 8, `.val-grid`) — 4 value cards absorbed into Before/After
- **Testimonials grid** (old section 9, `.test-grid`) — replaced by Featured Testimonial (#2) + Trust Strip (#6)

## Component Specifications

### 1. Hero Stats (`.hero-stats`)

Add a stat counter bar directly below the existing hero section, inside `<section class="hero">`.

- **Layout:** Flex row, 4 items, centered, semi-transparent white text on navy
- **Items:** `12+` Years Serving NYC | `200+` Businesses Trust Us | `5` Boroughs Covered | `0` Missed Services
- **Animation:** Numbers count up from 0 when entering viewport via IntersectionObserver. Use `data-target` attribute on each number span. Animation duration ~2s with easing. **Must include `setTimeout(3000)` fallback** that sets final values if observer hasn't triggered (project rule).
- **Mobile:** 2x2 grid below 600px
- **CSS:** Extend existing `.hero-stats` class from services.html — **add mobile 2x2 grid media query at 600px breakpoint** (current CSS only has flex row, no mobile override)
- **Remove:** The old `.trust-bar` section (static version of the same data, currently below hero)

### 2. Featured Testimonial (`.feat-test`)

New section immediately after hero.

- **Layout:** Full-width cream background, centered content, max-width 800px
- **Content:** Large opening quote mark (decorative SVG or CSS `::before`), the strongest testimonial quote in large serif font (Cormorant Garamond, ~1.5rem), avatar circle with gradient, client name (DM Sans 600), role and company (DM Sans 400, muted)
- **Quote source:** Use the James Whitfield testimonial (Building Manager, The Avalon Residences) — the strongest of the 4 current quotes
- **Mobile:** Same layout, slightly smaller font (1.2rem)
- **New CSS classes:** `.feat-test`, `.feat-test-quote`, `.feat-test-mark`, `.feat-test-author`, `.feat-test-av`

### 3. Certification Badges (`.cert-strip`)

New section after Featured Testimonial.

- **Layout:** White background, flex row with wrap, centered, gap 2rem
- **Badges (5):**
  1. Green Seal Certified — shield SVG icon + label
  2. EPA Safer Choice — leaf/shield SVG icon + label
  3. Insured & Bonded — document SVG icon + label
  4. Background Checked — person-check SVG icon + label
  5. NYC Licensed — building SVG icon + label
- **Style:** Each badge is flex column (icon on top, text below), muted navy color, small uppercase text (0.75rem, 600 weight)
- **Mobile:** 3+2 wrap below 600px (no horizontal scroll — flex-wrap handles it)
- **New CSS classes:** `.cert-strip`, `.cert-badge`, `.cert-badge-ico`, `.cert-badge-label`

### 4. What We Do — Polish Only

- Extract inline styles if any remain
- No structural changes — the 2 service cards are solid

### 5. Before/After Ecco (`.ba-section`)

New section replacing old sections 4 and 8.

- **Layout:** White background, section heading, then 2-column grid (1fr 1fr) with 1.5rem gap
- **Left column (`.ba-col-bad`):** Light red background (`#fff5f5`), 3px red left border (`#dc3545`), heading "What Most Companies Deliver"
  - 6 items with ✗ icon: Random crews every visit, Harsh chemical products, Hidden fees & surprise charges, Missed visits & no accountability, Cookie-cutter service plans, Slow or no response to issues
- **Right column (`.ba-col-good`):** Light green background (`#f0fdf4`), 3px green left border (`#16a34a`), heading "The Ecco Standard"
  - 6 items with ✓ icon: Your dedicated team every visit, 100% eco-certified products, Transparent flat-rate pricing, Zero missed services — guaranteed, Custom plans built for your space, Same-day response from your account team
- **Mobile:** Stack vertically (1 column) below 768px
- **New CSS classes:** `.ba-section`, `.ba-grid`, `.ba-col`, `.ba-col-bad`, `.ba-col-good`, `.ba-item`, `.ba-ico`
- **Overflow:** `.ba-grid` gets `overflow: hidden`

### 6. Trust Strip (`.trust-strip`)

New section after Before/After.

- **Layout:** Cream background, 3-column grid
- **Content:** 3 client quotes — use David Chen, Marcus Williams, and Dr. Patricia Morales from the current testimonials
- **CSS:** Reuse existing `.trust-strip` and `.trust-quote` classes from services.html (already in styles.original.css)
- **Mobile:** Single column stack below 768px

### 7. How It Works — Polish

- Extract the inline style `style="background:var(--wh)"` from the section tag → use class `.sec-white` or equivalent
- Extract `style="text-align:center;margin-top:2rem"` from button wrapper → use `.sec-cta-wrap`
- No structural changes

### 8. Industries Showcase — Redesign (`.ind-showcase`)

Replace the plain icon grid (`.ind-grid`) with expandable cards.

- **Layout:** Cream background, 4-column grid on desktop, 2-column on tablet, 1-column on mobile
- **Default state:** Each card shows icon + industry name (similar to current but in card format with subtle border/shadow)
- **Expanded state:** On click, card expands below to show 2-3 line description of how Ecco serves that industry. Only one card open at a time (accordion behavior).
- **Industries (8):** Corporate Offices, Medical & Dental, Retail & Showrooms, Gyms & Fitness, Schools & Daycares, Restaurants, Coworking Spaces, Residential Buildings
- **JS:** Click handler toggles `.ind-card-open` class. Clicking another card closes the previous one. **Default state must be fully usable without JS** — cards show collapsed state by default via CSS, JS only adds expand interactivity.
- **Animation:** `max-height` transition for smooth expand/collapse
- **New CSS classes:** `.ind-showcase`, `.ind-card`, `.ind-card-open`, `.ind-card-head`, `.ind-card-body`
- **Touch targets:** Cards have min-height 44px, `cursor: pointer`

### 9. Safe for Everyone — Keep As-Is

No changes. This section is well-structured and on-brand.

### 10. Video/Visual Story (`.story-sec`)

New section after Safe for Everyone.

- **Layout:** White background, section heading "See Ecco In Action", asymmetric photo grid
- **Grid:** 2 rows. Row 1: 1 large image (2fr) + 1 small image (1fr). Row 2: 1 small (1fr) + 1 large (2fr). Creates visual rhythm.
- **Images:** Use existing stock images — **skip `4.webp`** (already used as hero background). Use: `1.webp`, `2.webp`, `3.webp`, `careers-team.webp` for variety
- **Overlay:** Optional subtle text overlay on hover (e.g., "Office cleaning in Manhattan")
- **Mobile:** Single column, equal-width images
- **New CSS classes:** `.story-sec`, `.story-grid`, `.story-img`, `.story-img-lg`
- **All images:** `loading="lazy"`, proper `alt` text, `border-radius: 12px`

### 11. FAQ — Keep As-Is

No changes. Schema.org FAQPage markup is solid.

### 12. Premium CTA (`.cta-banner` redesign)

Redesign the existing `.cta-banner`.

- **Layout:** Navy background, centered content, max-width 700px
- **Content:**
  1. Heading: "Your custom proposal is one conversation away."
  2. Subtext: "Tell us about your space. In 24 hours, you'll have a detailed, transparent proposal — built by our team, not a computer."
  3. Trust signals row: `✓ 200+ NYC businesses trust us` · `✓ Zero missed services` · `✓ Satisfaction guaranteed`
  4. Dual CTA buttons:
     - Primary (white filled): "Get Your Free Proposal →" → links to quote.html
     - Secondary (white outline): "Email Us Directly" → mailto:info@eccofacilities.com
  5. Small footer text removed (redundant with the email button)
- **Extract inline styles:** Remove all `style="position:relative;z-index:2"` — add to `.cta-trust` and `.cta-btns` in CSS
- **New CSS classes:** `.cta-btns` (flex row for dual buttons), `.btn-ol-white` (outline white button variant)

## Inline Styles Extraction

All 16 inline styles must be extracted to CSS classes:

| Line | Current inline | New CSS class |
|------|---------------|---------------|
| 128 | GTM noscript `display:none;visibility:hidden` | Exception — required by GTM |
| 144 | `.hero-img` background-image | Keep as inline (dynamic image path) |
| 154 | Hero email `margin-top;font-size;color` | `.hero-email` |
| 154 | Hero email link `color;text-decoration` | `.hero-email a` (descendant rule) |
| 191 | Section `background:var(--wh)` | Add `.sec-white` class |
| 212 | Button wrapper `text-align;margin-top` | `.sec-cta-wrap` |
| 227 | Button wrapper `text-align;margin-top` | `.sec-cta-wrap` (reuse) |
| 240 | Button wrapper `text-align;margin-top` | `.sec-cta-wrap` (reuse) |
| 261 | Button wrapper `text-align;margin-top` | `.sec-cta-wrap` (reuse) |
| 297 | CTA trust `position;z-index` | Add to `.cta-trust` rule |
| 302 | CTA button wrap `position;z-index;margin-top` | `.cta-btns` |
| 319 | Honeypot field `position;left` | Exception — anti-spam honeypot |
| 256-259 | 4x avatar gradients | `.trust-av-1` through `.trust-av-3` (only 3 needed for Trust Strip) |

**Exceptions (2):** GTM noscript and honeypot field inline styles stay — they are third-party requirements.

## CSS & JS Changes

### New CSS (add to styles.original.css)

- `.hero-stats` — already exists, verify compatibility
- `.hero-email`, `.hero-email a` — hero email utility
- `.sec-white` — `background: var(--wh)`
- `.sec-cta-wrap` — `text-align: center; margin-top: 2rem`
- `.feat-test`, `.feat-test-quote`, `.feat-test-mark`, `.feat-test-author`, `.feat-test-av` — featured testimonial
- `.cert-strip`, `.cert-badge`, `.cert-badge-ico`, `.cert-badge-label` — certification badges
- `.ba-section`, `.ba-grid`, `.ba-col`, `.ba-col-bad`, `.ba-col-good`, `.ba-item`, `.ba-ico` — before/after
- `.trust-strip`, `.trust-quote` — already exists, verify
- `.ind-showcase`, `.ind-card`, `.ind-card-open`, `.ind-card-head`, `.ind-card-body` — industries
- `.story-sec`, `.story-grid`, `.story-img`, `.story-img-lg` — photo gallery
- `.cta-btns`, `.btn-ol-white` — CTA redesign
- `.trust-av-1` through `.trust-av-3` — avatar gradient classes (for Trust Strip, 3 quotes only)

Every new component must have: base styles + mobile media query + overflow:hidden on containers.

### CSS Cleanup (remove dead code)

- Remove old `.ind-grid` and `.ind-item` rules + all 4 media query references (lines 435-443, 670-676, 836, 871, 897 of styles.original.css) after replacing with `.ind-showcase`
- Check if `.test-grid`, `.test-card`, `.test-stars`, `.test-quote`, `.test-auth`, `.test-av`, `.test-name`, `.test-role` are used by testimonials.html — if not, remove them
- Check if `.trust-bar`, `.trust-i`, `.trust-num` are used by other pages — if not, remove them

### JS Changes (add to main.js)

- **Counter animation:** IntersectionObserver for `.hero-stats` numbers — animate from 0 to target on first viewport entry
- **Industries accordion:** Click handler on `.ind-card` — toggle `.ind-card-open`, close siblings
- No other JS changes needed

### Build Steps

1. Add `maximum-scale=1.0` to viewport meta tag in index.html (iOS Safari zoom prevention — project rule)
2. Edit `styles.original.css` — add all new CSS + remove dead CSS from replaced components
3. Edit `js/main.js` — add counter animation (with setTimeout fallback) + industries accordion
4. Edit `index.html` — restructure sections, extract inline styles
5. Minify: `eval "$(/opt/homebrew/bin/brew shellenv)" && npx clean-css-cli -o css/styles.css css/styles.original.css`
6. Bump cache busters on ALL 21 pages: CSS `?v=3.5`, JS `?v=1.5`
7. Add `.superpowers/` to `.gitignore`
6. Git commit all changes together
7. Push → Cloudflare auto-deploys
8. Verify on live `.pages.dev` URL
9. Ask user to verify on real device

## Scope Boundaries

**In scope:**
- index.html restructure
- CSS additions to styles.original.css + minification
- JS additions to main.js
- Cache buster bump on all 21 pages
- Inline style extraction

**Out of scope:**
- Changes to any other page's HTML structure
- New images (use existing stock photos)
- Video content creation
- HubSpot form integration (CTA links to quote.html)
- Changes to quote wizard or other interactive components
