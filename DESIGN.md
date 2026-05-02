# Design System

## Visual theme

**Cream sanctuary, sage as the only voice.** The form sits on warm cream/sage-tint backgrounds (`#EEF2ED` to `#F6F9F5`) with white card containers. Sage (`#2D7A32`) is the single saturated color, used for actions, accents, and the Alina script. Navy (`#0B1D38`) is the ink. Peach (`#DFE7E0`) is the secondary surface tint, mostly used for icon discs and subtle separators.

**Color strategy:** Restrained-to-Committed. Sage carries about 15-25% of any given screen's surface (CTAs + active states + script accents + flow-bar progress). Cream is the dominant surface; white is the card. Peach is for icon backgrounds and dashed dividers.

**Theme:** Light by default + opt-in dark variant ("Editorial midnight").
Physical scenes that defined each:
- Light: *"Office facilities manager at her desk under fluorescent ceiling light, mid-morning, comparing three vendor quotes between meetings."*
- Dark: *"Property manager reviewing three quotes from her living-room couch at 8pm with a single warm lamp on, evening winding down before bed."*

The dark variant is **not auto-applied via `prefers-color-scheme`** — the user toggles it explicitly via `.qf2-theme-toggle` (sun/moon button bottom-right). Choice persists in `localStorage` as `ecco_theme`. This honors the Adult brand voice (no surprise theme swaps); it also avoids the cascade trap from D95 where 40 V1 `@media(prefers-color-scheme:dark)` blocks were leaking. The new dark token set is fresh, V2-aligned, and lives under `[data-theme="dark"]` selector.

The previous note said "Dark mode would feel wrong" — and a generic SaaS dark would have. The Editorial Midnight variant keeps the editorial register: surface is `#1B2733` (warm teal-navy, NOT clinical blue), ink is `#EFE8D7` (marfil tostado, NOT pure white), peach disc becomes `#3A322A` (dorado tostado), sage lifts to `#6FB376` for 6.8:1 contrast on the dark surface. The form reads as "magazine printed on dark stock with marker-green annotations" rather than "tool that switches to dark by default to look modern".

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

### Dark variant — "Editorial Midnight"

Activated via `[data-theme="dark"]` on `<html>`. Same token names, dark values:

```css
--qf2-cream:        #1B2733;  /* primary surface — warm teal-navy */
--qf2-cream-2:      #243441;  /* card surface, slightly lighter */
--qf2-peach:        #3A322A;  /* icon-disc — dorado tostado, keeps warm */
--qf2-peach-deep:   #4A4036;
--qf2-edge-warm:    rgba(111,179,118,.22);  /* sage 22% — borders pop on dark */
--qf2-ink:          #EFE8D7;  /* marfil tostado — NOT pure white */
--qf2-muted:        #8A9AAB;
--qf2-sage:         #6FB376;  /* lifted lightness for 6.8:1 contrast on dark */
--qf2-sage-bright:  #82C589;
--qf2-sage-soft:    rgba(111,179,118,.14);
```

Contrast (verified for dark):
- Sage on midnight: 6.5:1 (AAA)
- Ink (marfil) on midnight: 13.8:1 (AAA)
- Muted on midnight: 5.2:1 (AA)
- Marfil on sage (active state): 4.1:1 (AA)

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

**Typography tier system (D59, 2026-04-27 — final):** Two tiers + one persona stamp. Caveat reduced to a **single use** after legibility feedback.

- **Persona stamp (Caveat — the ONLY usage).** `.qf2-alina-hero-text .qf2-alina-name` only. The italic script reads as Alina's signature on her message pill; everywhere else the cursive form was found to slow comprehension. Hard-locked to this single selector.
- **Tier 1 — Editorial (Fraunces italic).** Section labels phrased as questions, sub-promises, H2 accent words, porter title numerals, time-summary numerals. Selectors: `.qf2-section-label`, `.qf-dp-prompt-promise`, `.qf2-sum-edit-header`, `h2 em`.
- **Tier 2 — UI (DM Sans, weights and italic vary).** Everything else. Body, controls, helpers, status, eyebrows, links, presets. Italic + sage for "voice" moments (e.g. "Heads up~", "I'll send the team:", closers). Plain weight for content. Eyebrow uppercase 700 0.14em tracking for section markers in the snapshot.

**Hard rule:** Never reintroduce Caveat outside the Alina-name selector. The Facility Manager target scans under time pressure; cursive script slows comprehension. "Voice moments" use **DM Sans italic sage** instead — warm and readable.

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
