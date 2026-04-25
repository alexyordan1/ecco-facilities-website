# Quote form editorial redesign — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply five approved presentation-layer decisions (D1 sin bubble, D2 cool sage palette, D3 Fraunces stays, D4 Alina/H2 copy rewrites, D5 photo duotone cards) across all 8 screens of `quote.html`.

**Architecture:** Three-phase rollout. Phase 1 lands the shared CSS infrastructure (token swap, bubble strip, photo-card class) so subsequent phases are pure markup edits. Phase 2 implements the pilot screen (Step 2 SPACE). Phase 3 propagates to Welcome (the other photo-card screen). Phase 4 propagates the text-only changes (Alina copy + Size H2/sub) to the remaining 5 screens. Each phase ends in a commit.

**Tech Stack:** Plain HTML + CSS (no build step beyond `npx clean-css-cli`). No JS changes required. Cloudflare Pages auto-deploys from `main`.

**Spec source:** [`docs/superpowers/specs/2026-04-25-quote-form-editorial-redesign-design.md`](../specs/2026-04-25-quote-form-editorial-redesign-design.md)

---

## File structure

| File | Role | Changes |
|---|---|---|
| `css/quote-flow.source.css` | Source CSS (untracked, source of truth) | Token block, `.qf2-prompt` strip, new `.qf2-card-photo` rules |
| `css/quote-flow.css` | Minified output (tracked) | Regenerated via `npx clean-css-cli` |
| `quote.html` | Form markup (tracked) | Alina/H2/sub text edits, swap SVG → photo div in 9 cards, cache buster bump |
| `images/spaces/` | New asset directory | 8 placeholder photos for dev (Unsplash URLs inline; real assets curated separately) |

**Working directory throughout this plan:** `/Users/yoelvismercedes/Downloads/Ecco Webside`

**Convention for commits:** End-of-phase commits with conventional-commit messages prefixed `feat(quote-form-editorial):` so the editorial sprint groups in `git log`.

---

# PHASE 1 — CSS infrastructure

Goal: prepare the visual foundation so subsequent phases are markup-only.

## Task 1: Swap V2 design tokens (D2)

**Files:**
- Modify: `css/quote-flow.source.css:12430-12445` (the `.qf2-stage, .qf2-exit-overlay` token block)

- [ ] **Step 1: Open the file at the token block**

The block currently reads (lines 12430-12445 approx; selector was extended to include `.qf2-exit-overlay` in commit `136bcc0`):

```css
.qf2-stage,
.qf2-exit-overlay {
  --qf2-cream:        #FDF8F3;
  --qf2-cream-2:      #FBF4EC;
  --qf2-peach:        #F5E6D3;
  --qf2-peach-deep:   #EDD4B2;
  --qf2-sage:         #2D7A32;
  --qf2-sage-bright:  #3D9A43;
  --qf2-sage-soft:    #E3EDE4;
  --qf2-ink:          #2C3E50;
  --qf2-muted:        #8B95A5;
  --qf2-edge:         rgba(45,122,50,.14);
  --qf2-edge-warm:    rgba(237,212,178,.5);
  --qf2-fd:           'Fraunces', Georgia, serif;
  --qf2-fb:           'DM Sans', system-ui, sans-serif;
  --qf2-fh:           'Caveat', cursive;
}
```

- [ ] **Step 2: Replace with the new sage-leaning palette**

Use Edit to replace the value lines. Token names stay (the `edge-warm` name is now legacy — it points at sage, not peach — but renaming would ripple through every consumer):

```css
.qf2-stage,
.qf2-exit-overlay {
  --qf2-cream:        #EEF2ED;
  --qf2-cream-2:      #F6F9F5;
  --qf2-peach:        #DFE7E0;
  --qf2-peach-deep:   #C4D4C5;
  --qf2-sage:         #2D7A32;
  --qf2-sage-bright:  #3D9A43;
  --qf2-sage-soft:    #E3EDE4;
  --qf2-ink:          #0B1D38;
  --qf2-muted:        #6B7A8D;
  --qf2-edge:         rgba(45,122,50,.14);
  --qf2-edge-warm:    rgba(45,122,50,.16);
  --qf2-fd:           'Fraunces', Georgia, serif;
  --qf2-fb:           'DM Sans', system-ui, sans-serif;
  --qf2-fh:           'Caveat', cursive;
}
```

- [ ] **Step 3: Verify with grep**

Run: `grep -n "EEF2ED\|0B1D38" css/quote-flow.source.css | head -3`
Expected: at least 2 hits in the token block, confirming the new values are in place.

## Task 2: Strip the `.qf2-prompt` title bubble (D1)

**Files:**
- Modify: `css/quote-flow.source.css:12744-12755` (the `.qf2-prompt` block)
- Modify: `css/quote-flow.source.css:13966` (mobile media-query override)

- [ ] **Step 1: Replace the `.qf2-prompt` block to remove card framing**

Current:

```css
.qf2-prompt {
  background: #fff;
  border: 1px solid var(--qf2-edge-warm);
  border-radius: 24px 24px 24px 4px;
  padding: 14px 28px;
  max-width: 760px;
  width: 100%;
  box-shadow: 0 12px 32px -8px rgba(44,62,80,.08);
  margin: 0 0 20px;
  position: relative;
  text-align: center;
}
```

Replace with the editorial-flat version:

```css
.qf2-prompt {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  max-width: 760px;
  width: 100%;
  box-shadow: none;
  margin: 0 0 24px;
  position: relative;
  text-align: center;
}
```

Note: `.qf2-prompt-title` and `.qf2-prompt-sub` rules **stay as they are** — the H2 + sub keep their typography, only the wrapper card vanishes.

- [ ] **Step 2: Update the mobile media-query line**

Current line 13966 reads:

```css
.qf2-prompt { padding: 14px 18px; margin: 0 0 20px; }
```

Replace with:

```css
.qf2-prompt { padding: 0; margin: 0 0 20px; }
```

- [ ] **Step 3: Verify**

Run: `grep -nE "^\.qf2-prompt\s*\{" css/quote-flow.source.css`
Expected: shows the two block declarations (desktop + mobile) with the new transparent values nearby.

## Task 3: Add `.qf2-card-photo` class with duotone filter (D5)

**Files:**
- Modify: `css/quote-flow.source.css` after line 12846 (right after the `.qf2-card-ico svg` rule)

- [ ] **Step 1: Find the insertion point**

Run: `grep -n "qf2-card-ico svg" css/quote-flow.source.css`
Expected: returns line 12846 (`.qf2-card-ico svg { width: 26px; height: 26px; stroke-width: 1.8; }`). Insert immediately after.

- [ ] **Step 2: Add the photo class block**

Insert this CSS after line 12846:

```css
/* V2 2026-04-25 · Editorial redesign D5 — photo cards.
   Replaces the SVG icon circle on welcome + space cards. Photos pass through
   a CSS-only duotone filter so any source (Unsplash, original, b&w) lands on
   the same brand-sage tone without per-image editing. The wrapping `.qf2-card`
   already provides the cream→sage hover state; this rule only owns the round
   photo well. */
.qf2-card-photo {
  width: 52px; height: 52px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(45,122,50,.18), 0 6px 12px -4px rgba(11,29,56,.14);
  filter: grayscale(1) sepia(.2) hue-rotate(70deg) saturate(1.2) brightness(.95);
  transition: filter .3s, box-shadow .3s;
}
.qf2-card:hover .qf2-card-photo,
.qf2-card.is-selected .qf2-card-photo {
  filter: grayscale(.4) sepia(.3) hue-rotate(70deg) saturate(1.4) brightness(1.02);
  box-shadow: 0 0 0 1px rgba(45,122,50,.4), 0 8px 16px -4px rgba(11,29,56,.2);
}
/* Gradient fallback for "Something else" — opt-out of the duotone filter
   so the warm gradient palette reads true. */
.qf2-card-photo--gradient {
  background: linear-gradient(135deg, #E8C4A0 0%, #D4A374 50%, #5C4A87 100%);
  filter: none;
}
.qf2-card:hover .qf2-card-photo--gradient,
.qf2-card.is-selected .qf2-card-photo--gradient {
  filter: none;
}
```

- [ ] **Step 3: Verify**

Run: `grep -n "qf2-card-photo" css/quote-flow.source.css`
Expected: returns 4-6 lines, all in the new block.

## Task 4: Minify CSS, bump cache buster, commit Phase 1

**Files:**
- Modify: `css/quote-flow.css` (regenerated)
- Modify: `quote.html` (cache buster `?v=35.4` → `?v=35.5`)

- [ ] **Step 1: Minify**

Run: `cd "/Users/yoelvismercedes/Downloads/Ecco Webside/" && npx clean-css-cli -o css/quote-flow.css css/quote-flow.source.css`
Expected: silent success. Verify size with `wc -c css/quote-flow.css` (should be ~241k).

- [ ] **Step 2: Bump CSS cache buster in `quote.html`**

Use Edit:
- Old: `<link rel="stylesheet" href="css/quote-flow.css?v=35.4">`
- New: `<link rel="stylesheet" href="css/quote-flow.css?v=35.5">`

- [ ] **Step 3: Verify HTML cache buster**

Run: `grep "quote-flow.css" quote.html`
Expected: shows `v=35.5`.

- [ ] **Step 4: Commit**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside/" && \
git add css/quote-flow.css quote.html && \
git commit -m "feat(quote-form-editorial): phase 1 — sage palette, flat title, photo class

D2 token swap: cream warm → sage-tinted (#FDF8F3 → #EEF2ED), peach → sage edges,
ink slate → navy, muted cooler. Token names kept (legacy edge-warm now points
at sage rgba — renaming would ripple through every consumer).

D1 .qf2-prompt strips background/border/padding-as-card/shadow. The H2 + sub
keep their typography, only the wrapper card vanishes. Effect propagates to
all 8 screens automatically.

D5 new .qf2-card-photo class — round photo well with CSS-only duotone sage
filter (grayscale + sepia + hue-rotate). Hover state lifts the filter slightly
and beefs the shadow. .qf2-card-photo--gradient opts out for 'Something else'.

Cache buster: css v=35.4 → v=35.5. No HTML markup or JS change yet — Phase 2
applies the markup."
```

---

# PHASE 2 — Pilot screen: Step 2 SPACE

Goal: implement the full editorial look on Step 2 SPACE end-to-end. Validate visually before propagating.

## Task 5: Update Alina copy on Space screen (D4)

**Files:**
- Modify: `quote.html:480` (Alina hero text on Space screen)

- [ ] **Step 1: Locate the line**

Run: `grep -n "What are we caring for" quote.html`
Expected: one line, around 480.

- [ ] **Step 2: Replace via Edit**

- Old: `<span class="qf2-alina-name">Alina</span> &middot; What are we caring for?`
- New: `<span class="qf2-alina-name">Alina</span> &middot; The type tells me how to staff this`

- [ ] **Step 3: Verify**

Run: `grep -n "type tells me how to staff this" quote.html`
Expected: one hit on the same line.

## Task 6: Replace SVG icons with photo divs on the 6 Space cards (D5 markup)

**Files:**
- Modify: `quote.html` lines around 485-575 (the six `qf2-card[data-space]` blocks inside `qfScreen_space`)

- [ ] **Step 1: Locate the cards**

Run: `grep -n 'data-space=' quote.html`
Expected: 6 lines (Office, Medical, Retail, Restaurant, Fitness, Other) inside `qfScreen_space`.

- [ ] **Step 2: For each card, replace the `<span class="qf2-card-ico">…</span>` block with a `.qf2-card-photo` span**

The current pattern is:

```html
<button type="button" class="qf2-card" data-space="Office" aria-label="Office — corporate or coworking">
  <span class="qf2-card-ico" aria-hidden="true">
    <svg …></svg>
  </span>
  <span class="qf2-card-body">
    <span class="qf2-card-label">Office</span>
    <span class="qf2-card-hint">Corporate, coworking</span>
  </span>
</button>
```

Replace just the `<span class="qf2-card-ico">…</span>` with a photo span. Apply per card:

| data-space | New span |
|---|---|
| `Office` | `<span class="qf2-card-photo" aria-hidden="true" style="background-image:url('images/spaces/space-office.jpg')"></span>` |
| `Medical` | `<span class="qf2-card-photo" aria-hidden="true" style="background-image:url('images/spaces/space-medical.jpg')"></span>` |
| `Retail` | `<span class="qf2-card-photo" aria-hidden="true" style="background-image:url('images/spaces/space-retail.jpg')"></span>` |
| `Restaurant` | `<span class="qf2-card-photo" aria-hidden="true" style="background-image:url('images/spaces/space-restaurant.jpg')"></span>` |
| `Fitness` | `<span class="qf2-card-photo" aria-hidden="true" style="background-image:url('images/spaces/space-fitness.jpg')"></span>` |
| `Other` | `<span class="qf2-card-photo qf2-card-photo--gradient" aria-hidden="true"></span>` |

Notes for the engineer:
- The `aria-hidden` stays — the `aria-label` on the parent `<button>` already names the card.
- For photos that don't yet exist on disk, the file 404s gracefully — the duotone filter still applies to the (transparent) background and the card remains clickable. Real photos go in `images/spaces/` in Phase 5 task 14.
- Inline `style` attributes are an explicit exception to the CLAUDE.md "zero inline styles" rule for image-URL data — keeping each photo URL with its card is more maintainable than per-card CSS classes.

- [ ] **Step 3: Verify the swap**

Run: `grep -c 'qf2-card-photo' quote.html`
Expected: at least 6 (one per Space card; more once we hit Welcome in Phase 3).

Run: `grep -A1 'data-space="Office"' quote.html | head -3`
Expected: shows the new photo span on the line under the button.

## Task 7: Visual verify Step 2 SPACE on local dev

**Files:** none (verification only)

- [ ] **Step 1: Start dev server (if not already running)**

The launch.json already targets `serve.js` on port 8080. Use the preview tool, not Bash, per CLAUDE.md.

- [ ] **Step 2: Navigate to quote.html, click into Step 2**

In a fresh tab, open `http://localhost:8080/quote.html?qa=phase2`. Click Janitorial → lands on SPACE.

- [ ] **Step 3: Eyeball check**

Confirm visually:
- [ ] Cream background reads cooler (sage-tinted) than before
- [ ] Title "What kind of *space*?" floats with no white card around it
- [ ] Alina pill says "The type tells me how to staff this"
- [ ] Each of 6 cards shows a circular photo (or gradient for "Something else")
- [ ] Hover on a card lifts it and brightens the photo
- [ ] No console errors

If any check fails, do NOT proceed to commit — back-track to the broken task. If all pass, continue.

- [ ] **Step 4: Commit Phase 2**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside/" && \
git add quote.html && \
git commit -m "feat(quote-form-editorial): phase 2 — pilot Step 2 SPACE editorial pass

D4: Alina copy 'What are we caring for?' → 'The type tells me how to staff this'
(adds context the H2 can't carry — explains why we're asking).

D5: each of 6 space cards swaps the SVG icon span for a .qf2-card-photo span
pointing at images/spaces/space-*.jpg. 'Something else' uses
.qf2-card-photo--gradient for the warm-to-purple gradient (no photo).

Photo files don't exist yet — they go in Phase 5. Cards 404 gracefully today.

D1 + D2 effect arrive automatically thanks to Phase 1 CSS."
```

---

# PHASE 3 — Welcome screen photos (the other photo screen)

## Task 8: Replace SVG icons with photo divs on the 3 Welcome service cards

**Files:**
- Modify: `quote.html` lines around 286-360 (the three `qf2-card[data-service]` blocks inside `qfScreen_welcome`)

- [ ] **Step 1: Locate the cards**

Run: `grep -n 'data-service=' quote.html`
Expected: 3+ lines (janitorial, dayporter, both, possibly an unsure variant — only the 3 inside `qfScreen_welcome` get photos).

- [ ] **Step 2: Apply photo spans**

Same pattern as Task 6. Per card:

| data-service | New span |
|---|---|
| `janitorial` | `<span class="qf2-card-photo" aria-hidden="true" style="background-image:url('images/spaces/service-janitorial.jpg')"></span>` |
| `dayporter` | `<span class="qf2-card-photo" aria-hidden="true" style="background-image:url('images/spaces/service-dayporter.jpg')"></span>` |
| `both` | `<span class="qf2-card-photo" aria-hidden="true" style="background-image:url('images/spaces/service-combined.jpg')"></span>` |

- [ ] **Step 3: Visual verify Welcome**

Open `http://localhost:8080/quote.html?qa=phase3` (clear localStorage if a draft is haunting). Confirm:
- [ ] 3 service cards render with circular duotone photo wells
- [ ] Title "What brings you to *Ecco*?" floats flat (no bubble)
- [ ] Alina says "Hi there — let's start here →" (unchanged)
- [ ] Hover lifts each card

- [ ] **Step 4: Commit Phase 3**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside/" && \
git add quote.html && \
git commit -m "feat(quote-form-editorial): phase 3 — Welcome service cards get photos

D5: 3 service cards (janitorial / dayporter / both) swap SVG → .qf2-card-photo
pointing at images/spaces/service-*.jpg. Same duotone-sage filter as Space.

D1 + D2 effect already in place thanks to Phase 1."
```

---

# PHASE 4 — Text-only changes on the remaining 5 screens

These screens get only the Alina copy update (and Size also gets H2+sub tightening). All bubble-removal and palette changes already cascaded from Phase 1 CSS.

## Task 9: Update Info screen Alina copy (D4)

**Files:**
- Modify: `quote.html:387` (Alina hero text on Info screen)

- [ ] **Step 1: Locate**

Run: `grep -n "Now the friendly part" quote.html`
Expected: one hit.

- [ ] **Step 2: Replace**

- Old: `<span class="qf2-alina-name">Alina</span> &middot; Now the friendly part &rarr;`
- New: `<span class="qf2-alina-name">Alina</span> &middot; So I can email your quote — no spam, promise`

## Task 10: Update Size screen Alina copy + H2 + subtitle (D4)

**Files:**
- Modify: `quote.html:701` (Alina hero text on Size screen)
- Modify: `quote.html:707-710` (H2 mobile + desktop variants)
- Modify: `quote.html:712-713` (subtitle desktop variant)

- [ ] **Step 1: Replace Alina copy**

Locate with `grep -n "How much space?" quote.html` (returns the Alina line, not the H2).

- Old: `<span class="qf2-alina-name">Alina</span> &middot; How much space?`
- New: `<span class="qf2-alina-name">Alina</span> &middot; Pick a range — exact sq ft optional`

- [ ] **Step 2: Replace the H2 — both desktop and mobile spans**

The H2 currently reads (around lines 707-710):

```html
<h2 class="qf2-prompt-title">
  <span class="qf2-prompt-sub-desktop">How much space are we <em>cleaning</em>?</span>
  <span class="qf2-prompt-sub-mobile">How much <em>space</em>?</span>
</h2>
```

Replace with:

```html
<h2 class="qf2-prompt-title">
  <span class="qf2-prompt-sub-desktop">How <em>big</em> is the space?</span>
  <span class="qf2-prompt-sub-mobile">How <em>big</em>?</span>
</h2>
```

- [ ] **Step 3: Replace the subtitle desktop variant**

- Old (around line 712): `<span class="qf2-prompt-sub-desktop">Pick the closest range, or tell me exactly if you know it.</span>`
- New: `<span class="qf2-prompt-sub-desktop">Pick the closest range — or type the exact number.</span>`

(The mobile sub variant on the next line, if present, stays as-is — already short.)

## Task 11: Update Schedule screen Alina copy (D4)

**Files:**
- Modify: `quote.html:817` (Alina hero text on Days/Schedule screen)

- [ ] **Step 1: Locate**

Run: `grep -n "When works best" quote.html`
Expected: one hit.

- [ ] **Step 2: Replace**

- Old: `<span class="qf2-alina-name">Alina</span> &middot; When works best?`
- New: `<span class="qf2-alina-name">Alina</span> &middot; Days + a time window — flexible later`

## Task 12: Update Location screen Alina copy (D4)

**Files:**
- Modify: `quote.html:610` (Alina hero text on Location screen)

- [ ] **Step 1: Locate**

Run: `grep -n "One last thing" quote.html`
Expected: one hit.

- [ ] **Step 2: Replace**

- Old: `<span class="qf2-alina-name">Alina</span> &middot; One last thing &rarr;`
- New: `<span class="qf2-alina-name">Alina</span> &middot; Where we're meeting — for the site visit`

## Task 13: Update Review screen Alina copy (D4)

**Files:**
- Modify: `quote.html:1041` (Alina hero text on Review/contact screen)

- [ ] **Step 1: Locate**

Run: `grep -n "One last look" quote.html`
Expected: one hit.

- [ ] **Step 2: Replace**

- Old: `<span class="qf2-alina-name">Alina</span> &middot; One last look &rarr;`
- New: `<span class="qf2-alina-name">Alina</span> &middot; One scan and we're done &rarr;`

## Task 14: Visual sweep + commit Phase 4

- [ ] **Step 1: Walk through all 8 screens on local dev**

Using preview tools, navigate the whole flow (welcome → space → info → size → schedule → location → review → success) and confirm:
- [ ] Each title floats flat (no bubble)
- [ ] Each Alina message matches the spec table
- [ ] No layout breaks (overflows, broken pills, weird spacing)
- [ ] No console errors

- [ ] **Step 2: Commit Phase 4**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside/" && \
git add quote.html && \
git commit -m "feat(quote-form-editorial): phase 4 — Alina copy on remaining 5 screens

D4 rewrites:
- Info: 'Now the friendly part' → 'So I can email your quote — no spam, promise'
- Size: 'How much space?' → 'Pick a range — exact sq ft optional'
        H2 'How much space are we cleaning?' → 'How big is the space?'
        Sub tightened to 'Pick the closest range — or type the exact number.'
- Schedule: 'When works best?' → 'Days + a time window — flexible later'
- Location: 'One last thing' → 'Where we're meeting — for the site visit'
- Review: 'One last look' → 'One scan and we're done'

Welcome and Success keep their copy (already work)."
```

---

# PHASE 5 — Asset + final verification

## Task 15: Document photo asset spec for the curator

**Files:**
- Create: `images/spaces/CREDITS.md`

- [ ] **Step 1: Create the credits/specs file**

Use Write to create `images/spaces/CREDITS.md`:

```markdown
# Quote-form photo assets

Eight photos referenced from `quote.html` (Welcome + Space cards). All rendered
through the CSS duotone-sage filter on `.qf2-card-photo` — source images can be
color, B&W, or any temperature; the filter normalises them.

## Spec
- **Resolution:** 320×320 px (displayed at 52×52, 6× density buffer for retina)
- **Format:** webp q=80 primary, jpg q=85 fallback
- **Crop:** Square, focal subject centered
- **Source:** Unsplash free, Pexels, or original. Capture attribution below.

## Files needed
| Slot | Subject | Source URL | License |
|---|---|---|---|
| `service-janitorial.jpg` | Cleaning supplies / mop / cleaner mid-task | _to source_ | _to fill_ |
| `service-dayporter.jpg` | Uniformed staff in lobby / hallway | _to source_ | _to fill_ |
| `service-combined.jpg` | Wider view of staff in business setting | _to source_ | _to fill_ |
| `space-office.jpg` | Modern open-plan office, daylight | _to source_ | _to fill_ |
| `space-medical.jpg` | Clinic interior — exam or waiting area | _to source_ | _to fill_ |
| `space-retail.jpg` | Storefront interior or retail floor | _to source_ | _to fill_ |
| `space-restaurant.jpg` | Café / restaurant dining area | _to source_ | _to fill_ |
| `space-fitness.jpg` | Gym, yoga studio, or fitness floor | _to source_ | _to fill_ |

`Something else` does not need a photo — it uses a CSS gradient.

## Performance budget
Combined images per screen ≤ 80 KB after webp compression.
```

## Task 16: Final cross-screen verification + push

- [ ] **Step 1: Local sweep at desktop**

Reopen `http://localhost:8080/quote.html` in preview tool. Walk through every screen, capture screenshots into the chat for record. Confirm zero console warnings.

- [ ] **Step 2: Local sweep at mobile (375×812)**

Resize preview to mobile preset. Walk through every screen again. Confirm:
- [ ] Title still floats centered (no card)
- [ ] Cards reflow into single column where applicable
- [ ] Photos still render circular and duotone
- [ ] Alina pills don't overflow

- [ ] **Step 3: Commit credits file + push the whole sprint**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside/" && \
git add images/spaces/CREDITS.md && \
git commit -m "docs(quote-form-editorial): photo asset spec + slot list

Eight slots needed in images/spaces/. Curator workflow: source 8 photos
(Unsplash/Pexels free or original), drop into images/spaces/, fill the
attribution table. CSS duotone-sage filter handles colour normalisation.

Performance budget: combined images per screen ≤ 80 KB after webp compression."
git push origin main
```

- [ ] **Step 4: Wait for Cloudflare deploy + verify on live**

Monitor v=35.5 reaching production:

```bash
until curl -sL -A 'Mozilla/5.0' 'https://eccofacilities.com/quote.html' 2>/dev/null | grep -q 'v=35.5'; do sleep 5; done && echo "DEPLOY LIVE at $(date '+%H:%M:%S')"
```

Use `run_in_background: true` and wait for the completion notification, then:
- Hard-refresh the live URL
- Click through all 8 screens
- Confirm photos load (or show empty circles where assets aren't curated yet)
- Confirm console clean

---

# Self-review checklist

Run this against the spec before declaring the plan complete:

- **D1 (no bubble)** → Tasks 2 (CSS strip), inherited automatically by all 8 screens. ✓
- **D2 (palette)** → Task 1 (token swap), inherited automatically. ✓
- **D3 (Fraunces stays)** → No task needed (deliberate non-change). ✓
- **D4 (Alina + Size copy)** → Tasks 5, 9, 10, 11, 12, 13 cover all 6 message changes + Size H2/sub. ✓
- **D5 (photo cards)** → Tasks 3 (CSS class), 6 (Space markup), 8 (Welcome markup). ✓
- **Asset spec** → Task 15 documents the 8 slots. ✓
- **Cache buster** → Task 4 bumps CSS to v=35.5. ✓

No placeholders, no "implement later", every step has actual code or commands. Type/class names consistent across tasks (`.qf2-card-photo`, `.qf2-card-photo--gradient`, `.qf2-prompt`).

---

# Open follow-ups (NOT in this plan)

- Real photo curation in `images/spaces/` — content task, gated separately
- Day Porter flow visual mismatch — separate sprint per spec section 8
- Mobile a11y deep audit — separate sprint
