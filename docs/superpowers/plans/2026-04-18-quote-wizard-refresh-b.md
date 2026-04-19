# Quote Wizard Refresh (Option B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve 6 UX problems in the Ecco Facilities quote wizard (`/quote.html`) with a coherent visual refresh, without changing the 7-step IA, backend, or Alina persona.

**Architecture:** Vanilla HTML/CSS/JS additions in the `qf-*` namespace — extend existing design tokens and component system. All edits land in three files: `quote.html`, `css/quote-flow.css`, `js/quote-flow.js`. No framework, no new deps.

**Tech Stack:** HTML5 · CSS (custom properties, grid, backdrop-filter) · Vanilla JS · Playwright (already installed) for visual capture · `clean-css-cli` for minification · Cloudflare Pages for deploy.

**Spec:** `docs/superpowers/specs/2026-04-18-quote-wizard-refresh-b-design.md`

**Branching & commits:** All work happens on `main`. The spec calls for a single commit at the end once AYS passes. Intermediate phase checkpoints are for self-verification only — do NOT commit between phases unless AYS has been run and green.

**Note on spec precision:** The spec's D1 mentions "step-2 padding-top 108px → 48px". Runtime inspection shows line 7 of `quote-flow.css` already overrides with `.qf-screen { padding-top: 16px !important }`. The real cause of the visible top-gap is step-2's content not anchoring near the rail. This is resolved structurally by D3 (2-col form layout) — padding changes are not required.

---

## File Structure

```
/Users/yoelvismercedes/Downloads/Ecco Webside/
├── quote.html                        MODIFY — step markup, bubbles, value notes, CTA, cache busters
├── css/
│   ├── quote-flow.css                MODIFY — new components + dark mode blocks
│   └── quote-flow.backup.css         CREATE — pre-refactor backup
├── js/
│   ├── quote-flow.js                 MODIFY — bubble rendering, CTA state machine
│   └── quote-flow.backup.js          CREATE — pre-refactor backup
├── quote.backup.html                 CREATE — pre-refactor backup
└── docs/superpowers/
    ├── specs/2026-04-18-quote-wizard-refresh-b-design.md   (exists)
    └── plans/2026-04-18-quote-wizard-refresh-b.md          THIS FILE
```

---

## Phase 0 — Safety Net

### Task 0.1: Create rollback backups

**Files:**
- Create: `quote.backup.html`
- Create: `css/quote-flow.backup.css`
- Create: `js/quote-flow.backup.js`

- [ ] **Step 1: Copy current files to backup names**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
cp quote.html quote.backup.html
cp css/quote-flow.css css/quote-flow.backup.css
cp js/quote-flow.js js/quote-flow.backup.js
```

- [ ] **Step 2: Verify backups exist and are non-empty**

```bash
ls -la quote.backup.html css/quote-flow.backup.css js/quote-flow.backup.js
```

Expected: three files each >500 bytes.

---

## Phase 1 — Baseline Capture (visual reference)

### Task 1.1: Capture "before" screenshots of all 7 steps × 2 viewports

**Files:**
- Use: `docs/claude-design-input/capture.mjs` (already present)
- Output: `docs/superpowers/plans/before/` (new dir)

- [ ] **Step 1: Confirm preview server is running**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8080/quote.html
```

Expected: `HTTP 200`. If not, start the preview server via the Claude Preview MCP or run `node "/Users/yoelvismercedes/Downloads/Ecco Webside/serve.js"` in the background.

- [ ] **Step 2: Copy capture script with new output dir**

```bash
mkdir -p "/Users/yoelvismercedes/Downloads/Ecco Webside/docs/superpowers/plans/before"
cp "/Users/yoelvismercedes/Downloads/Ecco Webside/docs/claude-design-input/capture.mjs" \
   "/Users/yoelvismercedes/Downloads/Ecco Webside/docs/superpowers/plans/capture-before.mjs"
```

- [ ] **Step 3: Edit the copied script's OUT constant**

Open `docs/superpowers/plans/capture-before.mjs` and change:

```js
const OUT = '/Users/yoelvismercedes/Downloads/Ecco Webside/docs/superpowers/plans/before';
```

- [ ] **Step 4: Run the capture**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
node docs/superpowers/plans/capture-before.mjs
```

Expected: 14 PNGs in `docs/superpowers/plans/before/` (desktop-01 through desktop-07, mobile-01 through mobile-07).

- [ ] **Step 5: Verify screenshot count**

```bash
ls docs/superpowers/plans/before/ | wc -l
```

Expected: `14`.

---

## Phase 2 — Progress Indicator (D1)

### Task 2.1: Add CSS for `.qf-rail-fill-bar` (desktop linear progress)

**Files:**
- Modify: `css/quote-flow.css` (append new rules before the dark-mode block)

- [ ] **Step 1: Append the fill bar CSS**

Append these rules to `css/quote-flow.css` (find the comment `/* Rail progress indicator — replaces the price estimate aside */` near line 500, and insert BEFORE that block):

```css
/* D1 — Linear fill bar on top of rail (desktop) */
.qf-rail-fill-bar{
  position:absolute;top:0;left:0;right:0;height:2px;
  background:rgba(45,122,50,.12);overflow:hidden;
  border-radius:0 0 2px 2px;z-index:2;
}
.qf-rail-fill-bar::after{
  content:"";display:block;height:100%;
  background:var(--qf-sage-bright);
  width:var(--qf-progress,0%);
  transition:width .5s var(--qf-ease);
  border-radius:0 2px 2px 0;
}
.qf-flow-bar{position:relative}
@media (prefers-color-scheme:dark){
  .qf-rail-fill-bar{background:rgba(61,154,67,.18)}
}
@media (prefers-reduced-motion:reduce){
  .qf-rail-fill-bar::after{transition:none}
}
```

- [ ] **Step 2: Add the fill bar element to `quote.html`**

Open `quote.html`. Find the `<header class="qf-flow-bar" id="qfFlowBar">` line (around line 148). Insert this as the FIRST child of that header:

```html
<span class="qf-rail-fill-bar" role="progressbar" aria-label="Quote progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="qfRailFillBar"></span>
```

- [ ] **Step 3: Wire JS to update the fill bar on step change**

Open `js/quote-flow.js`. Locate the function that advances steps (search for where `qfRailFill` is updated — likely a function like `updateRailProgress` or inside `goToStep`). At the bottom of that function, add:

```js
// D1 — sync linear fill bar with current step
const fillBar = document.getElementById('qfRailFillBar');
if (fillBar) {
  const pct = Math.round((currentStepIndex / (totalSteps - 1)) * 100);
  fillBar.style.setProperty('--qf-progress', pct + '%');
  fillBar.setAttribute('aria-valuenow', String(pct));
}
```

If the existing code doesn't expose `currentStepIndex` / `totalSteps` by those names, use whatever variables are in scope at that location (search for `railFill` or `.is-current` to find context).

- [ ] **Step 4: Reload preview and verify visually**

```bash
curl -s http://localhost:8080/quote.html > /dev/null
```

Open `http://localhost:8080/quote.html` in browser, advance one step, confirm a green bar grows at top of the rail. No commit yet.

### Task 2.2: Add `.qf-rail-pill` (mobile-only compact indicator)

**Files:**
- Modify: `css/quote-flow.css`
- Modify: `quote.html`
- Modify: `js/quote-flow.js`

- [ ] **Step 1: Append pill CSS**

Append to `css/quote-flow.css`:

```css
/* D1 — Mobile pill progress indicator (replaces station labels <640px) */
.qf-rail-pill{display:none}
@media (max-width:640px){
  .qf-flow-rail{display:none}
  .qf-rail-pill{
    display:flex;flex-direction:column;align-items:center;
    width:100%;padding:6px 16px 8px;gap:4px;
    font-family:var(--qf-fb);
  }
  .qf-rail-pill-bar{
    width:100%;height:3px;background:rgba(45,122,50,.12);
    border-radius:2px;overflow:hidden;
  }
  .qf-rail-pill-bar::after{
    content:"";display:block;height:100%;
    background:var(--qf-sage-bright);
    width:var(--qf-progress,0%);
    transition:width .4s var(--qf-ease);
  }
  .qf-rail-pill-label{
    font-size:.72rem;font-weight:600;letter-spacing:.04em;
    color:var(--qf-muted);text-transform:uppercase;
  }
  .qf-flow-bar .qf-rail-fill-bar{display:none}
}
@media (prefers-color-scheme:dark) and (max-width:640px){
  .qf-rail-pill-bar{background:rgba(61,154,67,.18)}
  .qf-rail-pill-label{color:var(--qf-muted-light)}
}
```

- [ ] **Step 2: Add pill markup to `quote.html`**

Inside `<header class="qf-flow-bar" id="qfFlowBar">`, after the closing `</nav>` tag of `.qf-flow-rail`, add:

```html
<div class="qf-rail-pill" aria-hidden="true">
  <span class="qf-rail-pill-bar"></span>
  <span class="qf-rail-pill-label" id="qfRailPillLabel">Paso 1 de 7</span>
</div>
```

- [ ] **Step 3: Wire pill update in JS**

In the same function as Task 2.1 Step 3, below the fill bar update, add:

```js
// D1 — sync mobile pill
const pillBar = document.querySelector('.qf-rail-pill .qf-rail-pill-bar');
const pillLabel = document.getElementById('qfRailPillLabel');
if (pillBar) pillBar.style.setProperty('--qf-progress', pct + '%');
if (pillLabel) pillLabel.textContent = `Paso ${currentStepIndex + 1} de ${totalSteps}`;
```

- [ ] **Step 4: Verify on mobile viewport via Playwright preview**

Open the browser devtools, switch to iPhone 12 Pro viewport (390×844), reload, confirm pill appears and station labels are hidden.

---

## ⏸ Checkpoint 1 — Progress indicator works

Before moving on, manually confirm:
- Desktop: 2px sage-bright bar fills proportionally as you advance.
- Mobile (≤640px): pill shows "Paso X de 7" + green bar; full rail hidden.
- Dark mode: bar is visible with proper contrast (toggle OS dark mode and reload).

If any fail, fix before Phase 3.

---

## Phase 3 — Choice Cards v2 (D2)

### Task 3.1: Refactor `.qf-service-card` markup

**Files:**
- Modify: `quote.html` lines ~203–230 (the `.qf-s1-cards` block)

- [ ] **Step 1: Replace the 4 `.qf-service-card` button blocks**

In `quote.html`, find `<div class="qf-s1-cards" role="group" aria-label="Choose a service">` (around line 203). Replace the inner contents (the 4 buttons) with:

```html
<button type="button" class="qf-service-card" data-service="janitorial" data-service-label="Janitorial" role="radio" aria-checked="false">
  <span class="qf-service-card-ico" aria-hidden="true">&#x1F9F9;</span>
  <span class="qf-popular-badge">★ Most popular</span>
  <span class="qf-service-card-label">Janitorial</span>
  <span class="qf-service-card-hint">Recurring after-hours cleaning</span>
  <span class="qf-service-card-more" tabindex="-1" aria-hidden="true">¿Qué incluye?</span>
  <span class="qf-service-card-chev" aria-hidden="true">&rsaquo;</span>
</button>
<button type="button" class="qf-service-card" data-service="dayporter" data-service-label="Day Porter" role="radio" aria-checked="false">
  <span class="qf-service-card-ico" aria-hidden="true">&#x1F464;</span>
  <span class="qf-service-card-label">Day Porter</span>
  <span class="qf-service-card-hint">On-site during business hours</span>
  <span class="qf-service-card-more" tabindex="-1" aria-hidden="true">¿Qué incluye?</span>
  <span class="qf-service-card-chev" aria-hidden="true">&rsaquo;</span>
</button>
<button type="button" class="qf-service-card" data-service="both" data-service-label="Both Services" role="radio" aria-checked="false">
  <span class="qf-service-card-ico" aria-hidden="true">&#x2728;</span>
  <span class="qf-service-card-label">Both Services</span>
  <span class="qf-service-card-hint">Full 24/7 coverage</span>
  <span class="qf-service-card-more" tabindex="-1" aria-hidden="true">¿Qué incluye?</span>
  <span class="qf-service-card-chev" aria-hidden="true">&rsaquo;</span>
</button>
<button type="button" class="qf-service-card" data-service="unsure" data-service-label="Help me decide" role="radio" aria-checked="false">
  <span class="qf-service-card-ico" aria-hidden="true">&#x1F914;</span>
  <span class="qf-service-card-label">Help me decide</span>
  <span class="qf-service-card-hint">I'll explain the options</span>
  <span class="qf-service-card-more" tabindex="-1" aria-hidden="true">Ver opciones</span>
  <span class="qf-service-card-chev" aria-hidden="true">&rsaquo;</span>
</button>
```

Also change the container:
```html
<div class="qf-s1-cards" role="radiogroup" aria-label="Choose a service">
```

### Task 3.2: Replace the `.qf-service-card` CSS

**Files:**
- Modify: `css/quote-flow.css`

- [ ] **Step 1: Append new rules and override any older definitions**

Append at the end of the main component section (before `/* Accessibility & reduced motion */`):

```css
/* D2 — Service card v2 · grid */
.qf-s1-cards{
  display:grid;gap:16px;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  max-width:920px;width:100%;margin:28px auto 0;padding:0 16px;
}
@media (min-width:960px){
  .qf-s1-cards{grid-template-columns:repeat(2,1fr)}
  .qf-s1-cards[data-count="3"],
  .qf-s1-cards[data-count="4"]{grid-template-columns:repeat(2,1fr)}
}

/* D2 — Service card v2 · shared */
.qf-service-card{
  position:relative;display:flex;flex-direction:column;
  align-items:flex-start;gap:6px;
  padding:24px 22px;min-height:168px;
  background:var(--qf-cream-light);
  border:1.5px solid var(--qf-edge);border-radius:16px;
  cursor:pointer;overflow:hidden;
  font-family:var(--qf-fb);color:var(--qf-ink);text-align:left;
  box-shadow:var(--qf-shadow-sm);
  transition:transform .25s var(--qf-ease),
             border-color .2s var(--qf-ease),
             box-shadow .25s var(--qf-ease),
             background .2s var(--qf-ease);
}
.qf-service-card:hover{
  transform:translateY(-2px);
  border-color:var(--qf-sage);
  box-shadow:var(--qf-shadow-md);
}
.qf-service-card[aria-checked="true"]{
  border-color:var(--qf-sage-bright);
  background:var(--qf-sage-tint);
  box-shadow:var(--qf-shadow-sage);
}
.qf-service-card-ico{font-size:32px;line-height:1;margin-bottom:4px}
.qf-service-card-label{font-family:var(--qf-fd);font-size:1.4rem;font-weight:600;letter-spacing:.01em}
.qf-service-card-hint{font-size:.92rem;color:var(--qf-muted);line-height:1.35}
.qf-service-card-more{
  margin-top:auto;font-size:.78rem;font-weight:600;
  color:var(--qf-sage);letter-spacing:.02em;
  text-decoration:underline;text-underline-offset:3px;
}
.qf-popular-badge{
  position:absolute;top:12px;right:12px;
  display:inline-flex;align-items:center;gap:4px;
  padding:4px 10px;border-radius:999px;
  background:var(--qf-gold);color:#2b2412;
  font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
}
.qf-service-card-chev{display:none}

/* D2 — Service card · mobile rows */
@media (max-width:640px){
  .qf-s1-cards{grid-template-columns:1fr;gap:12px;margin-top:20px}
  .qf-service-card{
    flex-direction:row;align-items:center;
    min-height:88px;padding:14px 16px;gap:14px;
  }
  .qf-service-card-ico{
    font-size:28px;margin:0;flex:0 0 48px;
    display:inline-flex;align-items:center;justify-content:center;
    height:48px;width:48px;background:var(--qf-sage-tint);
    border-radius:12px;
  }
  .qf-service-card-label{font-size:1.1rem;margin:0}
  .qf-service-card-hint{font-size:.85rem;margin:0}
  .qf-service-card > :nth-child(3),
  .qf-service-card > :nth-child(4){
    display:flex;flex-direction:column;flex:1;min-width:0;
  }
  .qf-popular-badge{
    position:static;align-self:flex-start;margin-bottom:6px;
  }
  .qf-service-card-more{display:none}
  .qf-service-card-chev{
    display:inline-flex;margin-left:auto;
    font-size:1.4rem;color:var(--qf-muted);
    flex:0 0 auto;
  }
}

/* D2 — Dark mode */
@media (prefers-color-scheme:dark){
  .qf-service-card{
    background:rgba(30,53,98,.35);
    border-color:rgba(228,222,210,.14);
    color:#E8ECF2;
  }
  .qf-service-card:hover{border-color:var(--qf-sage-bright)}
  .qf-service-card[aria-checked="true"]{
    background:rgba(61,154,67,.16);
    border-color:var(--qf-sage-bright);
  }
  .qf-service-card-hint{color:var(--qf-muted-light)}
  .qf-service-card-more{color:var(--qf-sage-bright)}
  .qf-popular-badge{background:var(--qf-gold);color:#1a1508}
}
```

- [ ] **Step 2: Remove or neutralize legacy `.qf-service-card` rules**

Search `quote-flow.css` for other `.qf-service-card{` declarations and confirm the new rules come AFTER them (CSS cascade). If legacy rules conflict (e.g., `padding-top:32px!important` around line 133), remove or scope them with a specificity bump.

```bash
grep -n "qf-service-card" "/Users/yoelvismercedes/Downloads/Ecco Webside/css/quote-flow.css" | head -20
```

### Task 3.3: Update card click handler for `aria-checked` sync

**Files:**
- Modify: `js/quote-flow.js`

- [ ] **Step 1: Locate the service-card click handler**

```bash
grep -n "data-service\|qf-service-card" "/Users/yoelvismercedes/Downloads/Ecco Webside/js/quote-flow.js" | head
```

- [ ] **Step 2: In the click handler, sync aria-checked across the group**

Add after the click handler sets the chosen service:

```js
// D2 — sync radio state
document.querySelectorAll('.qf-s1-cards .qf-service-card').forEach(c => {
  c.setAttribute('aria-checked', c === clickedCard ? 'true' : 'false');
});
```

(Replace `clickedCard` with the variable name used in the existing handler.)

- [ ] **Step 3: Visually verify on desktop and mobile**

Open `http://localhost:8080/quote.html`, click through the 4 cards, confirm:
- Desktop: 2×2 grid, badge in top-right corner of Janitorial card only, hover lifts card
- Mobile: full-width rows, icon left in tinted box, chevron right, badge as inline pill above label

---

## ⏸ Checkpoint 2 — Step 1 looks right

Capture step-1 desktop + mobile screenshots and compare to `before/`. Visible improvements:
- Cards larger on desktop, no cramped look
- Badge no longer overlaps icon
- Mobile rows feel tappable (48px icon + 88px min-height)

---

## Phase 4 — Form Step Layout (D3)

### Task 4.1: Add `.qf-form-stage` 2-col CSS

**Files:**
- Modify: `css/quote-flow.css`

- [ ] **Step 1: Append form-stage rules**

```css
/* D3 — Form stage layout (step 2 "You") */
.qf-form-stage{
  display:grid;gap:32px;
  grid-template-columns:1fr;
  max-width:920px;width:100%;margin:24px auto 0;
  padding:0 16px;
}
@media (min-width:960px){
  .qf-form-stage{grid-template-columns:320px 1fr;gap:48px;margin-top:36px}
}
.qf-form-aside{display:flex;flex-direction:column;gap:14px}
.qf-form-aside .qf-hero-avatar{margin:0}
.qf-form-aside-bubble{
  position:relative;padding:16px 18px;
  background:var(--qf-cream-light);
  border:1px solid var(--qf-edge);border-radius:14px;
  font-family:var(--qf-fb);font-size:.95rem;line-height:1.45;
  color:var(--qf-ink-soft);
  box-shadow:var(--qf-shadow-sm);
}
.qf-form-main{display:flex;flex-direction:column;gap:16px}
.qf-form-title{
  font-family:var(--qf-fd);font-size:clamp(1.6rem,3.4vw,2.2rem);
  font-weight:600;line-height:1.15;margin-bottom:4px;
}
.qf-form-sub{font-size:.92rem;color:var(--qf-muted);margin-bottom:8px}
.qf-form-field{
  position:relative;display:flex;align-items:center;
  background:var(--qf-cream-light);
  border:1.5px solid var(--qf-edge);border-radius:12px;
  transition:border-color .2s var(--qf-ease);
  overflow:hidden;
}
.qf-form-field:focus-within{border-color:var(--qf-sage-bright)}
.qf-form-field-ico{
  display:inline-flex;align-items:center;justify-content:center;
  width:44px;flex:0 0 44px;color:var(--qf-muted);
  font-size:1rem;border-right:1px solid var(--qf-edge);
  background:transparent;
}
.qf-form-field input{
  flex:1;min-width:0;height:48px;padding:0 14px;
  font-family:var(--qf-fb);font-size:1rem;  /* 16px — iOS no-zoom */
  color:var(--qf-ink);background:transparent;border:0;outline:0;
}
.qf-form-field input::placeholder{color:var(--qf-muted-light)}
.qf-form-row{display:grid;gap:12px;grid-template-columns:1fr 1fr}
@media (max-width:520px){.qf-form-row{grid-template-columns:1fr}}

/* D3 — Dark mode */
@media (prefers-color-scheme:dark){
  .qf-form-aside-bubble{background:rgba(30,53,98,.35);border-color:rgba(228,222,210,.14);color:#E8ECF2}
  .qf-form-field{background:rgba(30,53,98,.35);border-color:rgba(228,222,210,.14)}
  .qf-form-field-ico{color:var(--qf-muted-light);border-right-color:rgba(228,222,210,.14)}
  .qf-form-field input{color:#E8ECF2}
}
```

### Task 4.2: Restructure step-2 markup

**Files:**
- Modify: `quote.html` — the step-2 section

- [ ] **Step 1: Locate the step-2 section**

```bash
grep -n "id=\"qfScreen_you\"\|step-2\|Tell me a little" "/Users/yoelvismercedes/Downloads/Ecco Webside/quote.html" | head
```

- [ ] **Step 2: Replace step-2 inner markup**

Inside the step-2 `<section class="qf-screen step-2" ...>`, replace the existing `<div class="qf-screen-inner">...</div>` content with:

```html
<div class="qf-screen-inner">
  <div class="qf-form-stage">
    <aside class="qf-form-aside">
      <div class="qf-hero-avatar">
        <picture>
          <source type="image/avif" srcset="images/alina-avatar-96.avif 1x, images/alina-avatar-192.avif 2x">
          <source type="image/webp" srcset="images/alina-avatar-96.webp 1x, images/alina-avatar-192.webp 2x">
          <img src="images/alina-avatar-96.jpg" alt="Alina" width="72" height="72" loading="eager" decoding="async">
        </picture>
      </div>
      <p class="qf-form-aside-bubble" data-alina-intro>Antes de continuar, déjame conocerte un poco. Así personalizo tu propuesta.</p>
    </aside>
    <div class="qf-form-main">
      <h2 class="qf-form-title">Cuéntame un poco <em>sobre ti</em></h2>
      <p class="qf-form-sub">Para personalizar la propuesta a tu nombre.</p>
      <div class="qf-form-row">
        <label class="qf-form-field">
          <span class="qf-form-field-ico" aria-hidden="true">&#x1F464;</span>
          <input type="text" name="firstName" placeholder="First name *" autocomplete="given-name" required>
        </label>
        <label class="qf-form-field">
          <span class="qf-form-field-ico" aria-hidden="true">&#x1F464;</span>
          <input type="text" name="lastName" placeholder="Last name (optional)" autocomplete="family-name">
        </label>
      </div>
      <label class="qf-form-field">
        <span class="qf-form-field-ico" aria-hidden="true">&#x2709;</span>
        <input type="email" name="email" placeholder="your@email.com *" autocomplete="email" required>
      </label>
      <label class="qf-form-field">
        <span class="qf-form-field-ico" aria-hidden="true">&#x260E;</span>
        <input type="tel" name="phone" placeholder="Phone (optional)" autocomplete="tel">
      </label>
      <!-- CTA inserted by Phase 6 -->
    </div>
  </div>
</div>
```

- [ ] **Step 3: Reload preview and verify step 2**

Advance from step 1 → step 2. Confirm:
- Desktop: avatar + bubble on left (~320px), form on right, no empty top gap
- Mobile: avatar + bubble on top, form below

---

## ⏸ Checkpoint 3 — Step 2 layout fixed

Capture step-2 desktop + mobile. Compare to `before/desktop-02-space.png` — the vertical gap should be gone.

---

## Phase 5 — Alina Bubbles + Value Notes (D4, D5)

### Task 5.1: Add `data-alina-intro` and `data-value-note` to steps 3–7

**Files:**
- Modify: `quote.html`

- [ ] **Step 1: Find each screen and add attributes**

For each `<section class="qf-screen step-N" ...>` from 3 through 7, add attributes:

| Step id | `data-alina-intro` | `data-value-note` |
|------|------|------|
| step-3 / `qfScreen_space` | "¿Dónde vamos a cuidar de tu espacio?" | "Para sugerir los productos y frecuencia correctos." |
| step-4 / `qfScreen_location` | "¿En qué dirección está el lugar?" | "Para calcular tiempos de equipo y rutas." |
| step-5 / `qfScreen_size` | "Más o menos, ¿qué tamaño tiene?" | "Para estimar horas-hombre precisas." |
| step-6 / `qfScreen_schedule` | "¿Cuándo te gustaría que empecemos?" | "Para coordinar disponibilidad real del equipo." |
| step-7 / `qfScreen_review` | "Aquí está tu plan — revísalo y lo ajusto si hace falta." | (none) |

Example for step-3 (apply to each):

```html
<section class="qf-screen step-3" id="qfScreen_space" role="tabpanel" aria-label="Space type"
         data-alina-intro="¿Dónde vamos a cuidar de tu espacio?"
         data-value-note="Para sugerir los productos y frecuencia correctos.">
```

### Task 5.2: Add `.qf-bubble` and `.qf-value-note` CSS

**Files:**
- Modify: `css/quote-flow.css`

- [ ] **Step 1: Append styles**

```css
/* D4 — Alina bubble on every step */
.qf-step-bubble{
  display:flex;align-items:flex-start;gap:12px;
  max-width:720px;margin:0 auto 20px;padding:0 16px;
  font-family:var(--qf-fb);
}
.qf-step-bubble-avatar{
  flex:0 0 40px;width:40px;height:40px;border-radius:50%;
  overflow:hidden;border:2px solid var(--qf-cream-light);
  box-shadow:var(--qf-shadow-sm);
}
.qf-step-bubble-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.qf-step-bubble-body{
  flex:1;min-width:0;padding:12px 16px;
  background:var(--qf-cream-light);
  border:1px solid var(--qf-edge);border-radius:14px 14px 14px 4px;
  font-size:.95rem;line-height:1.45;color:var(--qf-ink-soft);
  box-shadow:var(--qf-shadow-sm);
}
/* D5 — Value note */
.qf-value-note{
  display:inline-flex;align-items:center;gap:6px;
  margin:18px auto 0;padding:8px 14px;
  background:var(--qf-sage-tint);border-radius:999px;
  font-size:.78rem;color:var(--qf-sage);font-weight:500;
  max-width:fit-content;
}
.qf-value-note::before{content:"\2713";font-weight:700}

/* Dark mode */
@media (prefers-color-scheme:dark){
  .qf-step-bubble-body{background:rgba(30,53,98,.35);border-color:rgba(228,222,210,.14);color:#E8ECF2}
  .qf-value-note{background:rgba(61,154,67,.16);color:var(--qf-sage-bright)}
}
```

### Task 5.3: Add bubble + value-note rendering in JS

**Files:**
- Modify: `js/quote-flow.js`

- [ ] **Step 1: Write a helper function near other step-transition code**

Add this function (near `goToStep` or wherever screens activate):

```js
// D4+D5 — render Alina bubble + value note for steps 2-7
function qfRenderStepBubble(screen) {
  if (!screen) return;
  const intro = screen.getAttribute('data-alina-intro');
  const note  = screen.getAttribute('data-value-note');
  const inner = screen.querySelector('.qf-screen-inner');
  if (!inner) return;

  // Bubble
  if (intro && !inner.querySelector('.qf-step-bubble')) {
    const b = document.createElement('div');
    b.className = 'qf-step-bubble';
    b.setAttribute('aria-live', 'polite');
    b.innerHTML =
      '<span class="qf-step-bubble-avatar"><img src="images/alina-avatar-96.jpg" alt="Alina" width="40" height="40" loading="eager" decoding="async"></span>' +
      '<span class="qf-step-bubble-body"></span>';
    inner.insertBefore(b, inner.firstChild);
    // Typed reveal
    const body = b.querySelector('.qf-step-bubble-body');
    let i = 0;
    const tick = () => {
      body.textContent = intro.slice(0, ++i);
      if (i < intro.length) requestAnimationFrame(() => setTimeout(tick, 18));
    };
    tick();
  }

  // Value note
  if (note && !inner.querySelector('.qf-value-note')) {
    const n = document.createElement('span');
    n.className = 'qf-value-note';
    n.textContent = note;
    inner.appendChild(n);
  }
}
```

- [ ] **Step 2: Call the helper when a step activates**

In the existing step-activation code (where a screen gains `.is-active`), add:

```js
qfRenderStepBubble(newlyActiveScreen);
```

- [ ] **Step 3: Verify**

Navigate through steps 3-7 and confirm each shows:
- Alina bubble at top with typed-in text
- Value-note pill below content (except step 7)

---

## Phase 6 — Continue CTA (D6)

### Task 6.1: Add `.qf-continue-cta` CSS

**Files:**
- Modify: `css/quote-flow.css`

- [ ] **Step 1: Append CTA rules**

```css
/* D6 — Continue CTA */
.qf-continue-cta{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  min-width:160px;min-height:48px;padding:0 22px;
  background:var(--qf-sage);color:#fff;
  font-family:var(--qf-fb);font-size:1rem;font-weight:600;letter-spacing:.01em;
  border:0;border-radius:999px;cursor:pointer;
  box-shadow:var(--qf-shadow-sage);
  transition:background .2s var(--qf-ease),
             transform .2s var(--qf-ease),
             opacity .2s var(--qf-ease);
  align-self:flex-end;margin-top:16px;
}
.qf-continue-cta:hover{background:var(--qf-sage-bright);transform:translateY(-1px)}
.qf-continue-cta[aria-disabled="true"],
.qf-continue-cta:disabled{
  background:var(--qf-edge);color:var(--qf-muted);cursor:not-allowed;
  box-shadow:none;opacity:.85;
}
.qf-continue-cta.is-loading{pointer-events:none;opacity:.8}
.qf-continue-cta.is-loading::after{
  content:"";width:14px;height:14px;border-radius:50%;
  border:2px solid rgba(255,255,255,.4);border-top-color:#fff;
  animation:qf-cta-spin .8s linear infinite;
}
@keyframes qf-cta-spin{to{transform:rotate(360deg)}}

/* Mobile · sticky bottom */
@media (max-width:640px){
  .qf-continue-cta{
    position:fixed;left:16px;right:16px;
    bottom:calc(16px + env(safe-area-inset-bottom,0px));
    width:auto;margin:0;min-width:0;align-self:stretch;
    z-index:40;
  }
  .qf-screen.is-active{padding-bottom:96px}
  /* Clear the chat FAB (bottom-right) */
  .qf-continue-cta{right:72px}
}

/* Dark mode */
@media (prefers-color-scheme:dark){
  .qf-continue-cta[aria-disabled="true"],
  .qf-continue-cta:disabled{background:rgba(228,222,210,.14);color:var(--qf-muted-light)}
}

/* Reduced motion */
@media (prefers-reduced-motion:reduce){
  .qf-continue-cta,.qf-continue-cta:hover{transform:none;transition:none}
}
```

### Task 6.2: Insert CTA markup at the end of each step's main content

**Files:**
- Modify: `quote.html`

- [ ] **Step 1: Add CTA to step-1**

After the `.qf-s1-cards` closing `</div>`, still inside step-1's `.qf-screen-inner`, add:

```html
<button type="button" class="qf-continue-cta" data-qf-continue aria-disabled="true" disabled>
  Continue
  <span aria-hidden="true">&rsaquo;</span>
</button>
```

- [ ] **Step 2: Add the same CTA to steps 2-7**

Place the same `<button>` at the end of each step's `.qf-screen-inner` (step-2 goes inside `.qf-form-main`, step-7 at the end of the review card).

- [ ] **Step 3: JS state machine**

Add to `js/quote-flow.js`:

```js
// D6 — Continue CTA state machine
function qfUpdateContinue(screen, opts) {
  if (!screen) return;
  const btn = screen.querySelector('[data-qf-continue]');
  if (!btn) return;
  const {enabled = false, loading = false, label} = opts || {};
  btn.classList.toggle('is-loading', !!loading);
  if (loading) {
    btn.setAttribute('aria-disabled', 'true');
    btn.disabled = true;
    btn.firstChild.textContent = label || 'Processing… ';
  } else if (enabled) {
    btn.removeAttribute('aria-disabled');
    btn.disabled = false;
    btn.firstChild.textContent = (label || 'Continue') + ' ';
  } else {
    btn.setAttribute('aria-disabled', 'true');
    btn.disabled = true;
    btn.firstChild.textContent = label || 'Elige una opción ';
  }
}

// Wire each screen's Continue button
document.querySelectorAll('[data-qf-continue]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
    // Find the current step and dispatch its "advance" action
    const screen = btn.closest('.qf-screen');
    if (screen && typeof qfAdvanceFrom === 'function') {
      qfAdvanceFrom(screen);
    }
  });
});
```

If `qfAdvanceFrom` does not exist in the current codebase, wire the click to the same forward-transition used by existing card clicks (search for `is-exiting` in `quote-flow.js` to find the current transition function and call it with the appropriate argument).

- [ ] **Step 4: Enable CTA in response to selection**

In the service-card click handler (Task 3.3), after the aria-checked sync, add:

```js
qfUpdateContinue(document.querySelector('.qf-screen.step-1'), {enabled: true, label: 'Continue with ' + clickedCard.dataset.serviceLabel});
```

Repeat analogous `qfUpdateContinue` calls for steps 3-6 when their selections are made.

For step 2 (form) and step 4 (address), enable the CTA only when required fields are valid:

```js
function qfValidateForm(screen) {
  const requireds = screen.querySelectorAll('input[required]');
  return [...requireds].every(i => i.checkValidity());
}
// Attach input listeners:
document.querySelectorAll('.qf-screen.step-2 input').forEach(i => {
  i.addEventListener('input', () => {
    const scr = document.querySelector('.qf-screen.step-2');
    qfUpdateContinue(scr, {enabled: qfValidateForm(scr)});
  });
});
```

### Task 6.3: Verify CTA states

- [ ] **Step 1: Visual check**

On each step:
- With no selection: CTA shows "Elige una opción" in grey, cursor not-allowed
- After selection: CTA shows "Continue" in sage green
- Mobile: CTA sticky at bottom above safe-area
- Dark mode: CTA contrast correct

---

## ⏸ Checkpoint 4 — All 7 steps functional

Capture a full "after" run:

- [ ] **Capture after/ screenshots**

```bash
mkdir -p "/Users/yoelvismercedes/Downloads/Ecco Webside/docs/superpowers/plans/after"
cp "/Users/yoelvismercedes/Downloads/Ecco Webside/docs/superpowers/plans/capture-before.mjs" \
   "/Users/yoelvismercedes/Downloads/Ecco Webside/docs/superpowers/plans/capture-after.mjs"
# Edit OUT to point to after/
node "/Users/yoelvismercedes/Downloads/Ecco Webside/docs/superpowers/plans/capture-after.mjs"
```

- [ ] **Compare**

Open `before/desktop-02-space.png` and `after/desktop-02-space.png` side by side. The vertical gap must be gone. Repeat for all 7 steps × 2 viewports.

If any screen regressed, fix before Phase 7.

---

## Phase 7 — Accessibility & iOS Safari Pass

### Task 7.1: ARIA audit

- [ ] **Step 1: Verify each component's ARIA**

```bash
grep -nE "role=\"radiogroup\"|role=\"radio\"|role=\"progressbar\"|aria-checked|aria-live|aria-valuenow" "/Users/yoelvismercedes/Downloads/Ecco Webside/quote.html" | head
```

Expected: `role="radiogroup"` on `.qf-s1-cards`, `role="radio"` + `aria-checked` on each `.qf-service-card`, `role="progressbar"` + `aria-valuenow` on `#qfRailFillBar`, `aria-live="polite"` on each `.qf-step-bubble`.

### Task 7.2: Touch-target size check

- [ ] **Step 1: Playwright assertion**

Create `docs/superpowers/plans/test-a11y.mjs`:

```js
import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: {width:390,height:844}, isMobile:true, hasTouch:true });
const page = await ctx.newPage();
await page.goto('http://localhost:8080/quote.html');
await page.waitForTimeout(600);
const results = await page.$$eval('.qf-service-card, .qf-continue-cta, .qf-flow-back', els =>
  els.map(e => {
    const r = e.getBoundingClientRect();
    return { cls: e.className.split(' ')[0], w: Math.round(r.width), h: Math.round(r.height) };
  })
);
console.log(results);
const bad = results.filter(r => r.h < 44 || r.w < 44);
console.log(bad.length ? 'FAIL — small targets:' : 'PASS — all ≥44px', bad);
await browser.close();
```

- [ ] **Step 2: Run it**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
node docs/superpowers/plans/test-a11y.mjs
```

Expected final line: `PASS — all ≥44px []`.

### Task 7.3: iOS Safari zoom guard

- [ ] **Step 1: Verify input font-size ≥16px**

```bash
grep -n "qf-form-field input\|font-size" "/Users/yoelvismercedes/Downloads/Ecco Webside/css/quote-flow.css" | grep -i "input" | head
```

Confirm `.qf-form-field input { font-size: 1rem }` is present (from Task 4.1). If any input in the wizard uses a smaller font, raise it to `1rem`.

- [ ] **Step 2: Verify meta viewport**

```bash
grep "maximum-scale" "/Users/yoelvismercedes/Downloads/Ecco Webside/quote.html"
```

Expected: `maximum-scale=1.0` (already present). If missing, add.

### Task 7.4: Console noise check

- [ ] **Step 1: Ensure no console.log in new code**

```bash
grep -n "console.log" "/Users/yoelvismercedes/Downloads/Ecco Webside/js/quote-flow.js"
```

Remove any `console.log` you added during development.

---

## Phase 8 — Minify & Cache-Busters

### Task 8.1: Minify `quote-flow.css`

**Files:**
- Modify: `css/quote-flow.css` (in-place minify)

- [ ] **Step 1: Back up the expanded source before minify**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
cp css/quote-flow.css css/quote-flow.source.css
```

- [ ] **Step 2: Minify with clean-css-cli**

```bash
npx clean-css-cli -o css/quote-flow.css css/quote-flow.source.css
```

Expected: `css/quote-flow.css` size drops by ~25-40%. `clean-css-cli` must be the only minifier used — per project rules, Python regex minification is forbidden.

- [ ] **Step 3: Verify CSS still parses**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/css/quote-flow.css
```

Expected: `200`. Reload the quote page in browser; visual should still be correct.

### Task 8.2: Bump cache busters

**Files:**
- Modify: `quote.html`

- [ ] **Step 1: Find current version refs**

```bash
grep -nE "quote-flow\.(css|js)\?v=" "/Users/yoelvismercedes/Downloads/Ecco Webside/quote.html"
```

- [ ] **Step 2: Bump all refs to `v=5.0`**

In `quote.html`, replace every `?v=4.2` (or whatever the current value is) with `?v=5.0` on:
- `<link rel="stylesheet" href="css/quote-flow.css?v=...">`
- `<script src="js/quote-flow.js?v=...">`

Use exact replacement — do NOT globally replace across the file if other assets use different versions.

- [ ] **Step 3: Confirm**

```bash
grep "quote-flow\." "/Users/yoelvismercedes/Downloads/Ecco Webside/quote.html" | grep -v backup
```

Expected: every quote-flow reference carries `?v=5.0`.

---

## Phase 9 — AYS Audit

### Task 9.1: Run AYS

- [ ] **Step 1: Invoke AYS**

Run the `/ays` skill (or invoke via Skill tool: `ays`). It performs the 12-phase audit on all staged and unstaged changes.

Expected: score ≥90. Any issue found enters Plan Mode.

- [ ] **Step 2: Fix any issues**

If AYS reports issues, resolve them one by one. Common issues to expect and pre-empt:
- Missing `overflow: hidden` on new containers — add to `.qf-form-stage`
- Missing dark-mode block for a new class — audit every new rule has a `@media (prefers-color-scheme: dark)` counterpart
- Touch target <44px on CTA or icon button — enforce min-height
- Cache buster mismatch between CSS and JS — align both at `?v=5.0`

- [ ] **Step 3: Re-run AYS until score ≥90**

Loop until clean.

---

## Phase 10 — Commit & Deploy

### Task 10.1: Single commit

- [ ] **Step 1: Stage specific files**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
git add quote.html css/quote-flow.css js/quote-flow.js
git add docs/superpowers/specs/2026-04-18-quote-wizard-refresh-b-design.md
git add docs/superpowers/plans/2026-04-18-quote-wizard-refresh-b.md
```

Do NOT `git add -A` (risk of adding .superpowers/, node_modules, or capture scripts). Explicitly exclude backups:

```bash
git status | grep -E "backup|source\.css" || echo "no backup files staged — good"
```

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(quote): wizard refresh (B) — 6-problem resolution

Resolve 6 UX problems identified in review of /quote.html without
changing the 7-step IA or Alina persona:

- D1 Linear fill bar + mobile pill progress indicator
- D2 Choice card v2: grid on desktop, rows on mobile, integrated badge
- D3 2-col form layout for step "You" (closes the vertical gap)
- D4 Alina bubble rendering on every step (data-alina-intro + typed reveal)
- D5 Value-note pill explaining why each question is asked
- D6 Persistent Continue CTA with disabled/active/loading states

Cache busters bumped to v=5.0. Dark mode and iOS Safari
safeguards preserved. AYS score ≥90.

Spec: docs/superpowers/specs/2026-04-18-quote-wizard-refresh-b-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify the commit**

```bash
git log -1 --stat
```

Expected: commit shows exactly the 3 source files + 2 doc files changed.

### Task 10.2: Push and deploy verification

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Wait for Cloudflare deploy (~90s)**

Wait approximately 90 seconds for Cloudflare Pages to build and deploy.

- [ ] **Step 3: Verify on `.pages.dev`**

```bash
# Find the Pages URL — usually <project>.pages.dev
curl -sI https://eccofacilities.com/quote.html | grep -iE "cf-ray|last-modified"
```

Open `https://eccofacilities.com/quote.html` in a hard-refresh browser (Cmd+Shift+R). Verify:
- Fill bar visible at top on advance
- Choice cards in new grid
- Form step has 2-col layout without gap
- Continue CTA visible and state-correct
- Cache busters in Network tab show `?v=5.0`

- [ ] **Step 4: Ask user to verify on real iOS device**

Per project rule: "Ask user to verify on real device for significant layout changes." Send a short note to the user asking them to open the quote page on their phone and confirm:
- No input zoom on tap
- Sticky Continue CTA doesn't overlap chat FAB
- Cards feel tappable

### Task 10.3: Rollback procedure (if needed)

If deploy reveals a regression:

- [ ] **Step 1: Restore from backups**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
cp quote.backup.html quote.html
cp css/quote-flow.backup.css css/quote-flow.css
cp js/quote-flow.backup.js js/quote-flow.js
git add quote.html css/quote-flow.css js/quote-flow.js
git commit -m "revert(quote): rollback wizard refresh (B)"
git push origin main
```

- [ ] **Step 2: Invoke leccionaprendida**

Record the root cause and prevention steps to project memory per CLAUDE.md rules.

---

## Self-Review Checklist

Running the writer's self-review on this plan against the spec:

**1. Spec coverage:**
- D1 progress indicator → Phase 2 (Tasks 2.1, 2.2) ✓
- D2 choice cards → Phase 3 (Tasks 3.1–3.3) ✓
- D3 form layout → Phase 4 (Tasks 4.1–4.2) ✓
- D4 Alina bubbles → Phase 5 (Tasks 5.1–5.3) ✓
- D5 value notes → Phase 5 (Tasks 5.1–5.2) ✓
- D6 Continue CTA → Phase 6 (Tasks 6.1–6.3) ✓
- Backups → Phase 0 ✓
- iOS Safari → Phase 7 ✓
- Dark mode → each component's CSS ✓
- Minify + cache busters → Phase 8 ✓
- AYS + commit + deploy → Phases 9–10 ✓

**2. Placeholder scan:** No TBDs, no "implement later". Each task has concrete code.

**3. Type consistency:**
- `qfUpdateContinue(screen, opts)` signature used consistently
- `qfRenderStepBubble(screen)` one caller, one definition
- `data-alina-intro` / `data-value-note` attributes match JS `getAttribute` calls
- CSS class names (`.qf-continue-cta`, `.qf-form-stage`, `.qf-step-bubble`) consistent across HTML, CSS, JS

All clear.
