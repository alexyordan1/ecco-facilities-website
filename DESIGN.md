# Design System

## Visual theme

**Cream sanctuary, sage as the only voice.** The form sits on warm cream/sage-tint backgrounds (`#EEF2ED` to `#F6F9F5`) with white card containers. Sage (`#2D7A32`) is the single saturated color, used for actions, accents, and the Alina script. Navy (`#0B1D38`) is the ink. Peach (`#DFE7E0`) is the secondary surface tint, mostly used for icon discs and subtle separators.

**Color strategy:** Restrained-to-Committed. Sage carries about 15-25% of any given screen's surface (CTAs + active states + script accents + flow-bar progress). Cream is the dominant surface; white is the card. Peach is for icon backgrounds and dashed dividers.

**Theme:** Light. Physical scene: *"Office facilities manager at her desk under fluorescent ceiling light, mid-morning, comparing three vendor quotes between meetings."* Dark mode would feel wrong for the editorial register and the "earn-trust-with-warmth" goal.

**Anti-pattern check:** Resists category-reflex (cleaning industry → spray-bottle green or steel blue). Sage is closer to a magazine masthead than to a "fresh clean" gradient. No glassmorphism, no gradient text, no hero metrics, no identical card grids in production.

## Color Palette

All values defined as CSS custom properties on `.qf2-stage`:

```css
--qf2-cream:        #EEF2ED;  /* primary surface */
--qf2-cream-2:      #F6F9F5;  /* lighter surface for nested */
--qf2-peach:        #DFE7E0;  /* icon-disc, subtle separators (legacy name) */
--qf2-peach-deep:   #C4D4C5;  /* hover for peach surfaces */
--qf2-edge-warm:    rgba(45,122,50,.16);  /* sage 16% — card borders */
--qf2-ink:          #0B1D38;  /* primary text */
--qf2-muted:        #6B7A8D;  /* secondary text, hints */
--qf2-sage:         #2D7A32;  /* primary accent — CTAs, active state, links */
--qf2-sage-bright:  #3D9A43;  /* sage hover, lighter gradient */
--qf2-sage-soft:    rgba(45,122,50,.08);  /* sage tint for backgrounds */
```

**OKLCH values (for future migration / variants):**
- Sage `#2D7A32` ≈ `oklch(0.51 0.13 142)`
- Cream `#EEF2ED` ≈ `oklch(0.94 0.01 142)`
- Ink `#0B1D38` ≈ `oklch(0.20 0.05 251)`

**Contrast** (verified):
- Sage on cream: 6.8:1 (AAA)
- Ink on cream: 14.6:1 (AAA)
- Muted on cream: 4.6:1 (AA)
- White on sage (active state): 6.4:1 (AAA)

## Typography

**Three families, three roles.** Each loaded from Google Fonts at the top of `quote.html`.

```css
--qf2-fb: 'DM Sans', system-ui, sans-serif;       /* body, UI, buttons, chips */
--qf2-fd: 'Fraunces', 'Cormorant Garamond', serif; /* display H1/H2 italic accents */
--qf2-fh: 'Caveat', cursive;                       /* handwritten transitions */
```

**Scale (desktop, mobile in parentheses):**

| Role | Size | Weight | Family |
|---|---|---|---|
| H2 (prompt-title) | 40px (22px) | 500 | Fraunces |
| Card label | 15px (13.5-14.5px) | 600 | DM Sans |
| Card hint | 12.5px (11.5-12px) | 400 | DM Sans muted |
| Body / fields | 15px (14px) | 400 | DM Sans |
| CTA primary | 16px (14.5px) | 600 | DM Sans |
| Chip | 13px (13px) | 500 | DM Sans |
| Caveat helpers | 17-20px (15-16px) | 500 | Caveat |
| Eyebrow / kicker | 9-11px | 700 | DM Sans uppercase letter-spacing 0.14em |

**Italic-serif rule:** the Fraunces italic accent is reserved for ONE meaningful word per H2 (`how big is the *space*?`, `What kind of *space*?`, `Here's your *snapshot*.`). Never two, never zero on prompt screens.

**Typography tier system (D58, 2026-04-27):** Three tiers. Caveat reserved for *persona only* — never for content the user has to read clearly.

- **Tier 1 — Persona (Caveat).** Decorative voice moments. Examples: Alina name in hero pill, "Heads up~" callout, "I'll send the team:" tag (Alina speaking out loud), signature closers ("Quote in your inbox~", "We're almost there~", "Talk soon~"), quiz result hand-write, multi-location / location / out-of-area / visit / timeline hints, exit modal hand text, success extra, CTA subtext. Selectors: `.qf2-alina-hero-text .qf2-alina-name`, `.qf2-quiz-result-hand`, `.qf-dp-team-preview-tag`, `.qf2-multi-loc-hint`, `.qf2-location-hint .qf2-hand-label`, `.qf2-visit-indicator`, `.qf2-cta-subtext`, `.qf2-success-extra`, `.qf2-out-of-area-text .qf2-hand`, `.qf2-exit-modal-hand`, `.qf2-timeline-when`, `.qf2-numeric-label`.
- **Tier 2 — Editorial (Fraunces italic).** Section labels phrased as questions, sub-promises, Alina-flavored framing that is still content. Examples: "Which days do they work?", "What hours each day?", "When are we welcome?", "~ Add the porters you need…", "Let's tweak this~" (edit panel header). Selectors: `.qf2-section-label`, `.qf-dp-prompt-promise`, `.qf2-sum-edit-header`. Also: H2 accent words, porter title numerals, time-summary numerals (8, 40).
- **Tier 3 — UI (DM Sans, weights vary).** Anything clickable, scannable, or instructional. Examples: "Not sure? I can help you pick" quiz toggle, field helpers, CTA hint, snapshot row labels (uppercase eyebrow), phone opt-in link, day/jan/DP presets, DP CTA status, DP time-summary wrapper. Selectors: `.qf2-not-sure-link`, `.qf2-field-helper`, `.qf2-cta-hint`, `.qf2-sum-row-label`, `.qf2-phone-optin-link`, `.qf2-chip-preset`, `.qf-dp-preset`, `.qf-dp-cta-status`, `.qf-dp-time-summary` (wrapper).

**Hard rule:** Never use Caveat for primary actions, errors, validation status, instructions, or content the user must process to make a decision. The Facility Manager target scans under time pressure; cursive script slows comprehension.

## Layout

**Stacking model:** All step screens are absolutely positioned overlays inside `#qfStage`. One has `.is-active` at any moment. The previous step crossfades to opacity 0 + `inert` + `aria-hidden`. Inactive screens have `[hidden]` + the defensive `display:none !important` rule (Sprint 1).

**Spacing scale:** generous but rhythmic, not uniform.
- Hero pill ↓ prompt: 12-18px
- Prompt ↓ grid: 12-18px
- Grid ↓ catch-all: 18-12px
- Card padding: 12px (was 16/14/14, compacted in Sprint 1)
- Grid gap: 10px (was 16, compacted in Sprint 1)

**Breakpoints:** single transition at `max-width: 700px`. No tablet tier.

**Container max-widths:**
- `.qf2-prompt`: 760px
- `.qf2-grid-3` / `.qf2-grid-6`: 920px
- `.qf2-summary`: 920px
- `.qf2-space-other-wrap`: 480px
- Body inner padding: 40px desktop, 18px mobile

**Mobile body padding-bottom:** 76px (Sprint 1 — clears the `.qf2-ask-alina-float` pill).

## Components

### Card (`.qf2-card`)
White background, sage-edge-warm border, 20px radius. Vertical layout (icon top, label, hint). Hover: sage border + lift 1px. Selected: sage fill + checkmark via `::after`. Mobile: 2-column grid, padding 10/8, min-height 96px.

### Card icon (`.qf2-card-icon`)
52×52 peach disc with centered emoji glyph (28px). Sage box-shadow `0 0 0 1px rgba(45,122,50,.18), 0 6px 12px -4px rgba(11,29,56,.14)`. Mobile: 40×40 + 22px font. Gradient variant for "Other" replaced with regular peach in Sprint 2 (`School` card).

### Chip (`.qf2-chip`)
Pill 999px radius, white background, sage border, 13px DM Sans. Min-height 44px (touch target). `.is-selected` → sage fill + white + 1° rotate. Hover lift 1px.

### Preset chip (`.qf2-chip-preset`)
Subset of chip. Caveat italic muted by default. **Active state (Sprint 1 fix):** swaps to DM Sans 600 white on solid sage — never green-on-green.

### Quiz chip (`.qf2-quiz-chip`)
For the "Not sure?" recommender. Pill, white, sage border, 13px. Card-style shadow (Sprint 1) for elevation parity with the cards above.

### CTA primary (`.qf2-cta`)
Pill 999px, sage fill, white text, 16px DM Sans 600, 16/36 padding, 52px min-height. Sage shadow `0 8px 20px -4px rgba(45,122,50,.4)`. Hover: lift 2px + amplified shadow.

### Field (`.qf2-field`)
White card with sage-edge border + sage focus ring (`0 0 0 4px var(--qf2-sage-soft)`). Icon left, input right. Cream-ringed when erroring.

### Field helper (`.qf2-field-helper`)
Caveat 17px sage 500 (Sprint 1). Lives below `.qf2-field`. Mobile 15px.

### Field error (`.qf2-field-err`)
DM Sans 13.5px 500 red `#B23B3B` (Sprint 1). Mobile 13px.

### Alina pill (`.qf2-alina-hero`)
Floating header pill, white card, 28px avatar of Alina (real photo), `Alina ·` label in sage Caveat, message in DM Sans. Per-screen message changes ("The type tells me how to staff this").

### Floating helper (`.qf2-ask-alina-float`)
Bottom-left sticky pill, "Ask Alina anything". Persistent across all screens. Mobile body padding-bottom reserves clearance (Sprint 1).

### Flow-bar
Desktop: horizontal rail with 7 station dots + connecting line (sage when active). Stations: SERVICE / SPACE / YOU / SIZE / SCHEDULE / LOCATION / REVIEW.
Mobile: condensed to "Step 2 of 7" + percentage rail.

## Motion

- **Transition between steps:** opacity 0 → 1 over 400ms `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo). The previous step fades while the new one fades in.
- **Hover lifts:** `translateY(-1px)` over 200ms `cubic-bezier(.34,1.56,.64,1)` (slight overshoot — only place we use spring; never on layout properties).
- **Card selection:** `transform: rotate(-1deg)` for chips when selected (subtle hand-stamped feel, never on cards).
- **No bounce, no elastic, no parallax, no scroll-driven reveals.**
- **Reduced motion:** all transforms collapse to opacity-only when `prefers-reduced-motion: reduce`.

## Iconography

- **8 service/space cards use system color emojis** (Sprint 2 swap from photos): 🧹 ☀️ 🔄 🏢 🏥 🛍️ 🍽️ 🏋️ 🏫 ❓
- **SVG icons elsewhere** (field icons, flow-bar dots, trust strip, success page): single-stroke 1.5-2px, sage current color, 16-22px viewBox 24.
- **No filled / dual-tone illustrations.** Outline only.

## Components NOT to use

- Side-stripe borders (`border-left: 4px solid sage`). Use full sage-edge borders or background tints.
- Gradient text. Single sage color always.
- Glassmorphism / backdrop-filter. Solid surfaces.
- Hero-metric template. The form has no `98% retention` numbers. Trust strip uses 1-line text + tiny SVG, not big stats.
- Identical 3-column card grids on landing-style screens. The form's 3×2 grids are functional pickers, not features-list grids.
