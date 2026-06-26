# Combined Flow Service-Cue Labeling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the two services unmistakable in the quote wizard — a 🧹 green "cleaning" cue (you give days, we decide time) and a 🧍 blue "day porter" cue (you choose hours) — and fix bug E (porter days following cleaning days until customized).

**Architecture:** Purely additive cues on existing screens (no flow/structure change). Static cue markup in `quote.html` on the `size`/`days` (cleaning) and `schedule` (porter) prompts; a JS-toggled "· N of 2" sub-label shown only in the Combined flow. Bug E adds a `STATE.dpDaysCustomized` flag + a re-seed on cleaning-days change.

**Tech Stack:** Vanilla JS (`js/quote-flow.js`), static HTML (`quote.html`), CSS (`css/noir.css` tokens, `css/quote-noir.css` component). No build step. Playwright e2e + preview MCP for verification.

**Spec:** `docs/superpowers/specs/2026-06-26-combined-flow-labeling-design.md`

---

### Task 1: Service-cue CSS + porter color token

**Files:**
- Modify: `css/noir.css:1-7` (add `--accent-porter` tokens next to `--accent`)
- Modify: `css/quote-noir.css` (add `.qf-svc-cue` component near the other `.qf2-prompt` rules ~line 477)

- [ ] **Step 1: Add the porter color tokens** in `css/noir.css` `:root` (after `--accent-rgb:159,203,123;` line 6):

```css
  --accent-porter:#78AAFF; --accent-porter-soft:#A9C7FF; --accent-porter-rgb:120,170,255;
```

- [ ] **Step 2: Add the `.qf-svc-cue` component** to `css/quote-noir.css` (right after the `.qf-screen:not(.is-welcome) .qf2-prompt{ text-align:center; }` rule, ~line 477). Base + the two service variants; centered to match the prompts; legible scrim over the photo:

```css
/* Service cue — sits above the prompt title so the user always knows WHICH
   service this step configures (🧹 cleaning = we decide time; 🧍 porter = you
   decide hours). The .qf-svc-cue-step "· N of 2" only shows in the Combined flow. */
.qf-svc-cue{ display:inline-flex; align-items:center; gap:7px; margin:0 0 .7rem; padding:6px 13px; border-radius:99px; font-size:.72rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase; text-shadow:none; }
.qf-svc-cue-clean{ color:var(--accent-soft); background:rgba(var(--accent-rgb),.13); border:1px solid rgba(var(--accent-rgb),.42); }
.qf-svc-cue-porter{ color:var(--accent-porter-soft); background:rgba(var(--accent-porter-rgb),.13); border:1px solid rgba(var(--accent-porter-rgb),.42); }
.qf-svc-cue-step{ opacity:.75; font-weight:500; }
.qf-svc-cue-who{ display:block; font-size:.82rem; font-weight:300; color:var(--ink-dim); margin:-.3rem 0 .2rem; text-shadow:0 1px 10px rgba(0,0,0,.55); }
/* hidden until JS marks the flow as Combined */
.qf-svc-cue-step[hidden]{ display:none; }
```

- [ ] **Step 3: Verify** — no build; visual check happens in Task 5. Confirm braces balance:

Run: `awk '{o+=gsub(/{/,"{"); c+=gsub(/}/,"}")} END{print o"="c, o-c}' css/quote-noir.css`
Expected: equal counts, diff 0.

- [ ] **Step 4: Commit**

```bash
git add css/noir.css css/quote-noir.css
git commit -m "feat(quote): service-cue component + porter color token"
```

---

### Task 2: Static cleaning/porter cue markup on the 3 prompts

**Files:**
- Modify: `quote.html` — size prompt (inside `#qfScreen_size` ~533+), days prompt (above `#qfS4Title` line 627), schedule prompt (above line 713 title)

The cue goes as the first child of each screen's `.qf2-prompt`, before the `<h2 class="qf2-prompt-title">`. Cleaning screens get the green cue, schedule gets the blue cue. The `qf-svc-cue-step` span starts `hidden` (JS shows it for Combined).

- [ ] **Step 1: Cleaning cue on the SIZE prompt.** Find the `<div class="qf2-prompt">` inside `#qfScreen_size` and insert as its first child:

```html
          <span class="qf-svc-cue qf-svc-cue-clean">🧹 Your cleaning<span class="qf-svc-cue-step" hidden> · 1 of 2</span></span>
          <span class="qf-svc-cue-who">You pick the days — we size the crew &amp; hours from your space.</span>
```

- [ ] **Step 2: Cleaning cue on the DAYS prompt.** Insert the SAME two lines as Step 1 immediately before `<h2 class="qf2-prompt-title" id="qfS4Title">` (line 627).

- [ ] **Step 3: Porter cue on the SCHEDULE prompt.** Insert before `<h2 class="qf2-prompt-title">Let&rsquo;s plan your <em>coverage</em>.</h2>` (line 713):

```html
          <span class="qf-svc-cue qf-svc-cue-porter">🧍 Your day porter<span class="qf-svc-cue-step" hidden> · 2 of 2</span></span>
          <span class="qf-svc-cue-who">You choose the hours — a porter on-site through your day.</span>
```

- [ ] **Step 4: Bump cache-busters** for quote-noir.css (Task 1) — in `quote.html`, `quote-noir.css?v=58` → `?v=59`. (quote-flow.js bumps in Task 3.)

- [ ] **Step 5: Commit**

```bash
git add quote.html
git commit -m "feat(quote): cleaning/porter service cues on size, days, schedule prompts"
```

---

### Task 3: Show the "· N of 2" step label only in Combined

**Files:**
- Modify: `js/quote-flow.js` — add a helper + call it on screen entry for size/days/schedule

- [ ] **Step 1: Add a `syncServiceCueSteps()` helper** near `renderS4Title` (~line 714, after that function). It un-hides the `.qf-svc-cue-step` spans only when service is `both`:

```javascript
  function syncServiceCueSteps() {
    var both = STATE.service === 'both';
    document.querySelectorAll('.qf-svc-cue-step').forEach(function (el) { el.hidden = !both; });
  }
```

- [ ] **Step 2: Call it on entry** to size, days, and schedule. In `goToScreen`, alongside the existing per-screen entry code (the `if (name === 'days')` block ~line 1136 and wherever size/schedule activate), add `syncServiceCueSteps();`. Simplest: call it unconditionally near the top of the screen-activation effect (it's cheap and idempotent) — add right after `goToScreen` sets the new screen active.

```javascript
    syncServiceCueSteps(); // 🧹/🧍 "· N of 2" visible only in the Combined flow
```

- [ ] **Step 3: Bump quote-flow.js cache-buster** in `quote.html`: `quote-flow.js?v=39.16` → `?v=39.17`.

- [ ] **Step 4: Commit**

```bash
git add js/quote-flow.js quote.html
git commit -m "feat(quote): show '· N of 2' service-cue step only in Combined flow"
```

---

### Task 4: Bug E — porter days follow cleaning days until customized

**Files:**
- Modify: `js/quote-flow.js` — `dpToggleDay` (~2826) + `dpApplyPreset` (~2840) mark customized; the days-Continue 'both' seed (~2321) re-seeds; observer seed (~2920) unchanged

- [ ] **Step 1: Init the flag.** Wherever `STATE` is first defined (the STATE object literal), add `dpDaysCustomized: false,`. (If STATE is built incrementally, add `STATE.dpDaysCustomized = false;` near the other dp defaults.)

- [ ] **Step 2: Mark customized when the user edits PORTER days.** In `dpToggleDay` and `dpApplyPreset` (both already call `dpSyncCustomHours(p); dpRender();`), add before `dpRender()`:

```javascript
      if (STATE.service === 'both') STATE.dpDaysCustomized = true;
```

- [ ] **Step 3: Re-seed on cleaning-days change.** Replace the existing 'both' seed in the days-Continue handler (~line 2321):

```javascript
        if (STATE.service === 'both' && (!STATE.dpDays || !STATE.dpDays.length)) {
          STATE.dpDays = STATE.days.slice();
        }
```

with:

```javascript
        if (STATE.service === 'both') {
          STATE.dpDays = STATE.days.slice(); // keep legacy mirror current
          // E-fix: porter days follow cleaning days UNTIL the user customizes them.
          if (!STATE.dpDaysCustomized && STATE.dpPorters && STATE.dpPorters.length) {
            STATE.dpPorters.forEach(function (p) { p.days = STATE.days.slice(); dpSyncCustomHours(p); });
          }
        }
```

- [ ] **Step 4: Write the failing e2e test** in `tests/e2e/both-flow.spec.js` (append a test). Use the existing helpers (`freshOpen`, `expectActive`, the day-chip + porter-card drivers — mirror the patterns already in that file):

```javascript
test('E — editing cleaning days re-seeds untouched porter days, respects customized', async ({ page }) => {
  await freshOpen(page);
  // ... pick Combined, set cleaning days Mon+Tue, reach schedule (porter pre-filled Mon+Tue)
  // assert porter days == Mon,Tue
  // ... go back to days, change cleaning days to Wed,Thu, continue to schedule
  // assert porter days == Wed,Thu  (followed, because untouched)
  // ... now toggle a porter day by hand (customize), go back, change cleaning days again
  // assert porter days unchanged (respected)
});
```

(Fill the driver steps from the existing `both-flow.spec.js` patterns; if a helper is missing, add it to `helpers.js`.)

- [ ] **Step 5: Run the test, watch it pass with the fix** (Steps 1-3 already applied):

Run: `npx playwright test tests/e2e/both-flow.spec.js --project=desktop-chrome --reporter=line`
Expected: PASS (incl. the new test).

- [ ] **Step 6: Commit**

```bash
git add js/quote-flow.js tests/e2e/both-flow.spec.js tests/e2e/helpers.js
git commit -m "fix(quote): E — Combined porter days follow cleaning days until customized"
```

---

### Task 5: Verify all three flows + full e2e + AYS

- [ ] **Step 1: Preview-drive each flow** at 390px and 1280px (preview MCP). Confirm: cleaning screens show the 🧹 green cue + "You pick the days…" line; schedule shows 🧍 blue cue + "You choose the hours…"; in **Combined**, both show "· 1 of 2" / "· 2 of 2"; in standalone flows the step label is hidden; no layout break; prompts still centered.

- [ ] **Step 2: Run the full e2e suite:**

Run: `npx playwright test --project=desktop-chrome --reporter=line` (free port 8080 first)
Expected: all green (the existing 40 + the new E test).

- [ ] **Step 3: Run `/ays`** (mandatory pre-commit gate). Address anything it flags.

- [ ] **Step 4: Screenshot proof** (preview MCP) of a Combined cleaning screen + schedule screen at mobile, share with Alex.

---

### Task 6: Ship

- [ ] **Step 1:** Confirm branch is `combined-flow-redesign`, working tree clean, e2e green.
- [ ] **Step 2:** Merge ff to `main`: `git push origin combined-flow-redesign:main` (only after explicit Alex OK).
- [ ] **Step 3:** Poll live HTML for the new `?v=` (quote-noir v59 + quote-flow v39.17), confirm cues render on eccofacilities.com, ask Alex for the iPhone pass.
