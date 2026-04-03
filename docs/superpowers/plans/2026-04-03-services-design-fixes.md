# Services Page Design Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all design critique findings — critical touch targets, scroll indicators, visual hierarchy, and polish.

**Architecture:** CSS-only fixes in `styles.original.css`, re-minified with `clean-css-cli`. One HTML tweak for checklist toggle icon. No JS changes needed.

**Tech Stack:** CSS, HTML, clean-css-cli (Node.js)

---

### Task 1: Fix Tab Button Touch Targets (CRITICAL)

**Files:**
- Modify: `css/styles.original.css:613-617`

The `.svc-tab` has `min-height: 48px` but renders at 21.6px because `display: block` doesn't enforce min-height on inline content. Need `display: inline-flex` with centering.

- [ ] **Step 1: Fix `.svc-tab` display and alignment**

In `css/styles.original.css`, replace lines 613-617:

```css
/* BEFORE */
.svc-tab {
  min-height: 48px; padding: .7rem 2rem; font-family: var(--fb); font-size: .88rem; font-weight: 600;
  border: 2px solid var(--bl); border-radius: var(--r); background: transparent; color: var(--tb);
  cursor: pointer; transition: background .15s, color .15s, border-color .15s;
}

/* AFTER */
.svc-tab {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 48px; padding: .7rem 2rem; font-family: var(--fb); font-size: .88rem; font-weight: 600;
  border: 2px solid var(--bl); border-radius: var(--r); background: transparent; color: var(--tb);
  cursor: pointer; transition: background .15s, color .15s, border-color .15s;
}
```

- [ ] **Step 2: Verify with preview_inspect**

Run `preview_inspect` on `.svc-tab` at mobile (375px). Expected: `height >= 48px`, `boundingBox.height >= 44px`.

- [ ] **Step 3: Commit**

```bash
git add css/styles.original.css
git commit -m "fix: tab buttons now reach 48px touch target with inline-flex"
```

---

### Task 2: Add Scroll Indicator to Industry Strip

**Files:**
- Modify: `css/styles.original.css:652-656` (inside `@media max-width: 900px`)

The horizontal industry scroll strip has no visual cue that it's scrollable.

- [ ] **Step 1: Add gradient fade-out mask to `.ind-grid` on mobile**

In `css/styles.original.css`, inside the `@media (max-width: 900px)` block, replace the `.ind-grid` rules:

```css
/* BEFORE */
  .ind-grid {
    display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
    gap: .75rem; padding-bottom: .5rem; -webkit-overflow-scrolling: touch;
  }

/* AFTER */
  .ind-grid {
    display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
    gap: .75rem; padding-bottom: .5rem; -webkit-overflow-scrolling: touch;
    mask-image: linear-gradient(to right, black 85%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
  }
```

- [ ] **Step 2: Verify visually**

Take a mobile screenshot. The last industry item should fade out on the right edge, signaling horizontal scrollability.

- [ ] **Step 3: Commit**

```bash
git add css/styles.original.css
git commit -m "fix: add gradient fade hint for scrollable industry strip on mobile"
```

---

### Task 3: Increase H3 Service Title Visual Weight

**Files:**
- Modify: `css/styles.original.css:621`

The H3 headings ("Janitorial Services", "Day Porter Services") at 1.3rem blend with body text. Need more visual anchoring.

- [ ] **Step 1: Increase `.svc-panel h3` size and spacing**

```css
/* BEFORE */
.svc-panel h3 { font-family: var(--fd); font-size: 1.3rem; font-weight: 600; color: var(--navy); margin-bottom: .5rem; }

/* AFTER */
.svc-panel h3 { font-family: var(--fd); font-size: 1.5rem; font-weight: 600; color: var(--navy); margin-bottom: .75rem; margin-top: 1.5rem; }
```

- [ ] **Step 2: Also add a subtle bottom border to separate visually**

After the `.svc-panel h3` rule, add:

```css
.svc-panel h3::after { content: ''; display: block; width: 40px; height: 2px; background: var(--green); margin-top: .5rem; border-radius: 1px; }
```

- [ ] **Step 3: Verify visually**

Preview screenshot. H3 should now clearly anchor each panel with a green accent line.

- [ ] **Step 4: Commit**

```bash
git add css/styles.original.css
git commit -m "fix: stronger visual weight on service panel H3 titles with green accent"
```

---

### Task 4: Fix Checklist Toggle Size and Add Icon

**Files:**
- Modify: `css/styles.original.css:625-630`
- Modify: `services.html` (lines 104, 146 — toggle buttons)

The toggle is 13px text with no visual affordance. Need larger text and a chevron icon.

- [ ] **Step 1: Update CSS for larger toggle**

```css
/* BEFORE */
.checklist-toggle {
  display: none; min-height: 44px; margin-top: .8rem; padding: .6rem 1.2rem;
  background: transparent; border: 1.5px solid var(--bl); border-radius: var(--r);
  font-family: var(--fb); font-size: .82rem; font-weight: 600; color: var(--blue);
  cursor: pointer; transition: border-color .2s, color .2s; width: 100%; justify-content: center; align-items: center;
}

/* AFTER */
.checklist-toggle {
  display: none; min-height: 44px; margin-top: .8rem; padding: .6rem 1.2rem;
  background: transparent; border: 1.5px solid var(--bl); border-radius: var(--r);
  font-family: var(--fb); font-size: .88rem; font-weight: 600; color: var(--blue);
  cursor: pointer; transition: border-color .2s, color .2s; width: 100%; justify-content: center; align-items: center; gap: .4rem;
}
.checklist-toggle::after { content: '\25BC'; font-size: .7rem; transition: transform .2s; }
.checklist-toggle[aria-expanded="true"]::after { transform: rotate(180deg); }
```

- [ ] **Step 2: Verify the chevron rotates**

Click the toggle on mobile. The chevron should point down (collapsed) and rotate up (expanded).

- [ ] **Step 3: Commit**

```bash
git add css/styles.original.css
git commit -m "fix: checklist toggle larger font, chevron icon with rotation"
```

---

### Task 5: Add Visual Break Between Hero and Services Section

**Files:**
- Modify: `css/styles.original.css` — add rule after `.svc-compare`

The transition from the dark hero to the light services section is abrupt.

- [ ] **Step 1: Add a subtle gradient transition**

After line 611 (`.svc-compare`), add:

```css
#services { border-top: 3px solid var(--green); }
```

- [ ] **Step 2: Verify visually**

A thin green accent line should appear at the top of the services section, providing visual separation.

- [ ] **Step 3: Commit**

```bash
git add css/styles.original.css
git commit -m "fix: green accent border between hero and services section"
```

---

### Task 6: Add Top Gradient Bar to Dark Eco Cards

**Files:**
- Modify: `css/styles.original.css` — `.val-card-dark` rules (lines 469-474)

The cream `.val-card` cards have a gradient top bar on hover (via `::after`). The dark eco cards don't have this — inconsistent.

- [ ] **Step 1: Add gradient bar to `.val-card-dark`**

```css
/* BEFORE */
.val-card-dark {
  background: rgba(255,255,255,.05); border-color: var(--bd);
}

/* AFTER */
.val-card-dark {
  background: rgba(255,255,255,.05); border-color: var(--bd);
}
.val-card-dark::after { background: linear-gradient(90deg, var(--green), var(--blue)); }
```

- [ ] **Step 2: Verify**

Hover over an eco card. The top gradient bar should appear (green to blue), matching the cream cards behavior.

- [ ] **Step 3: Commit**

```bash
git add css/styles.original.css
git commit -m "fix: eco dark cards get gradient bar on hover, matching val-card pattern"
```

---

### Task 7: Fix H4 Hierarchy in Better Together Section

**Files:**
- Modify: `services.html` — Better Together card titles (lines ~180-184)

Better Together cards use H3 but they're under an H2. Should be H4 for correct heading hierarchy.

- [ ] **Step 1: Change H3 to H4 in Better Together cards**

In `services.html`, change all 5 card titles from `<h3>` to `<h4>`:

```html
<!-- BEFORE -->
<h3>A Single Point of Contact</h3>
<!-- AFTER -->
<h4>A Single Point of Contact</h4>
```

Apply to all 5 cards: "A Single Point of Contact", "The Same Dedicated Team", "Seamless Coordination", "Simplified Billing", "Complete Coverage 24/7".

- [ ] **Step 2: Add CSS for `.val-card h4`**

In `css/styles.original.css` after the `.val-card h3` rule (~line 453), add:

```css
.val-card h4 { font-family: var(--fd); font-size: 1.1rem; font-weight: 600; color: var(--navy); margin-bottom: .6rem; }
```

- [ ] **Step 3: Verify heading hierarchy**

Check that the page has: H1 (hero) > H2 (section titles) > H3 (panel service names) > H4 (subsections + cards). No skipped levels.

- [ ] **Step 4: Commit**

```bash
git add services.html css/styles.original.css
git commit -m "fix: Better Together cards use H4 for correct heading hierarchy"
```

---

### Task 8: Re-minify CSS and Bump Versions

**Files:**
- Modify: `css/styles.css` (re-minify)
- Modify: `services.html` (bump CSS version)

- [ ] **Step 1: Re-minify CSS with clean-css-cli**

```bash
eval "$(/opt/homebrew/bin/brew shellenv)" && npx clean-css-cli -o css/styles.css css/styles.original.css
```

- [ ] **Step 2: Bump CSS version in services.html**

Change `css/styles.css?v=3.1` to `css/styles.css?v=3.2`.

- [ ] **Step 3: Commit and push**

```bash
git add css/styles.css css/styles.original.css services.html
git commit -m "chore: re-minify CSS v3.2 with all design fixes"
git push origin main
```

- [ ] **Step 4: Verify on live site**

Wait for Cloudflare deploy, hard refresh, verify:
- Tab buttons reach 48px height
- Industry strip has fade hint
- H3 titles have green accent
- Checklist toggle has chevron
- Eco cards have gradient bar on hover
- Zero console errors

---

## Self-Review Checklist

- [x] All 4 critique findings addressed (touch targets, scroll hint, H3 weight, btn-primary)
- [x] Note: btn-primary `background-color: transparent` is NOT a bug — it uses `background: linear-gradient()` which is correct. The inspect tool only showed `background-color`, not the gradient. No fix needed.
- [x] Every step has exact code
- [x] File paths are exact
- [x] No placeholders
- [x] Tasks are independent and committable
