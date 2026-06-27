# Review Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the quote wizard's final review screen (`qfScreen_contact`) so it faithfully shows everything the client entered (data-driven, can't silently drop a field), in the premium Editorial style, with full a11y and four conversion boosters — the lead-funnel's last step, so regression safety is paramount.

**Architecture:** Replace the per-flow `if/else` in `qf2PopulateSummary` (js/quote-flow.js) with a declarative `QF2_REVIEW_SECTIONS` model + `build*` helpers; render via a loop into a `<dl>` summary. Phase 1 refactors the engine with **byte-exact parity** (guarded by characterization tests) before any visible change; later phases restructure, complete fidelity, add conversion, and clean up.

**Tech Stack:** Static HTML (`quote.html`), CSS (`css/quote-noir.css`), vanilla JS (`js/quote-flow.js`), Playwright e2e (`tests/e2e/`, `--project=desktop-chrome`, server `node serve.js` :8080). No build step. Branch `combined-flow-redesign`.

**Spec:** `docs/superpowers/specs/2026-06-27-review-redesign-design.md`

**House rules (CLAUDE.md):** zero inline styles; bump `?v=` cache-busters in the same commit as CSS/JS changes; no `console.log` in prod (the dev guard uses `console.warn` gated to preview hosts); new CSS needs base+mobile+desktop; run `/ays` before each commit (passes this session → proceed); verify mobile AND desktop.

---

## File map

- `js/quote-flow.js` — `qf2PopulateSummary` (~3047-3296) → model + loop; `FIELD_TO_SECTION` (4362-4366); edit-panel dispatch (3354-3530); phone/notes wiring (3300-3332); dead `populateSummary` (~3564-3700) + dead edit handlers (~3849-3962) to delete.
- `quote.html` — review markup (739-872); success-timeline pattern to reuse (880-919).
- `css/quote-noir.css` — `.qf2-rv-editorial` component (new).
- `tests/e2e/{both,janitorial,dayporter}-flow.spec.js` + `helpers.js` — characterization + new assertions.

---

## Phase 1 — Engine refactor to a data-driven model (byte-exact parity)

No visible change. Prove the model reproduces today's output before touching structure.

### Task 1.1: Characterization tests pin the CURRENT review output

**Files:** Modify `tests/e2e/both-flow.spec.js`, `tests/e2e/janitorial-flow.spec.js`, `tests/e2e/dayporter-flow.spec.js`.

- [ ] **Step 1: Add a helper** to read the whole summary as normalized text. In `tests/e2e/helpers.js`, append and export:

```javascript
/** Read the review summary as normalized whitespace text (for parity snapshots). */
async function readSummaryText(page) {
  return (await page.locator('#qfScreen_contact .qf2-summary').innerText()).replace(/\s+/g, ' ').trim();
}
module.exports.readSummaryText = readSummaryText;
```

- [ ] **Step 2: Add a parity test per flow** that drives to the review and asserts the exact current strings. In `both-flow.spec.js`, append inside the describe:

```javascript
test('PARITY — Combined review summary (snapshot of current output)', async ({ page }) => {
  await page.click('.qf2-card[data-service="both"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
  await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
  await h.pickSchedule(page, 'Monday', 'morning'); await h.expectActive(page, 'qfScreen_schedule');
  await page.click('#qfDpScheduleContinue'); await h.expectActive(page, 'qfScreen_location');
  await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
  await h.fillInfo(page, { role: 'Facilities Manager' }); await h.expectActive(page, 'qfScreen_contact');
  const txt = await h.readSummaryText(page);
  expect(txt).toContain('Combined');
  expect(txt).toContain('Day porter plus janitorial');
  expect(txt).toContain('Office');           // space type
  expect(txt).toContain('Cleaning · Monday'); // the When row primary (current 'both' format)
  expect(txt).toContain('Porter 1 ·');        // porter line
  expect(txt).toContain('Test User');         // name from fillInfo
  expect(txt).toContain('test+e2e@example.com');
});
```

(Mirror with a janitorial parity test asserting `Mornings (loosely 6 am–noon)` shows, and a dayporter parity test asserting `Porter 1 ·`. Use the existing helpers; copy the assertions for the actual current strings — run Step 3 to discover any you guessed wrong and correct them.)

- [ ] **Step 3: Run — must PASS against current code** (this captures the baseline):

Run: `(lsof -ti:8080 | xargs kill -9 2>/dev/null; sleep 1); npx playwright test tests/e2e/both-flow.spec.js tests/e2e/janitorial-flow.spec.js tests/e2e/dayporter-flow.spec.js --project=desktop-chrome --reporter=line`
Expected: all green (incl. the 3 new PARITY tests). If a `toContain` fails, correct it to the actual current string — that string IS the baseline.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/helpers.js tests/e2e/both-flow.spec.js tests/e2e/janitorial-flow.spec.js tests/e2e/dayporter-flow.spec.js
git commit -m "test(quote): characterization snapshots pin current review output (parity net)"
```

### Task 1.2: Introduce `QF2_REVIEW_SECTIONS` + build helpers, reproduce output exactly

**Files:** Modify `js/quote-flow.js` (`qf2PopulateSummary` ~3047-3296).

- [ ] **Step 1: Add the model + helpers** at the top of `qf2PopulateSummary` (keep `setStackedValue` verbatim). The build helpers return `{ primary, subs }` and write to the SAME ids the current code uses, so output is identical. Initially keep ONE `schedule` build that returns today's "When" content (split happens in Phase 2):

```javascript
// Data-driven review model. Each descriptor maps a section to its STATE and an
// optional build(). Renders into the existing #qf2Sum* ids → output unchanged.
function buildService() {
  return { primary: SERVICE_NAMES[STATE.service] || STATE.service || '', subs: [SERVICE_CAPTIONS[STATE.service]] };
}
function buildYou() {
  var name = (STATE.userName || '') + (STATE.userLastName ? ' ' + STATE.userLastName : '');
  var subs = [];
  if (STATE.userEmail) subs.push(STATE.userEmail);
  if (STATE.userPosition) subs.push(STATE.userPosition);
  return { primary: name.trim(), subs: subs };
}
// buildSpace / buildSchedule: lift the CURRENT body verbatim (space row 3090-3121,
// when row 3158-3283) into these helpers, returning {primary, subs} instead of
// calling setStackedValue inline. The decorate-only bits (visit indicator 3115,
// certainty badge 3123, CTA swap 3137) stay as post-loop steps for now.
```

- [ ] **Step 2: Replace the inline population** with a loop that calls each build and `setStackedValue` into the matching id. Map: service→`qf2SumService`, info→`qf2SumYou`, space→`qf2SumSpace` (+`qf2SumWhere` for address), schedule→`qf2SumWhen`. Keep the decorate post-steps (visit indicator, badge, CTA) exactly as today.

- [ ] **Step 3: Run the parity tests — must STILL PASS (byte parity):**

Run: `(lsof -ti:8080 | xargs kill -9 2>/dev/null; sleep 1); npx playwright test --project=desktop-chrome --reporter=line`
Expected: ALL green (41 + 3 parity). Any diff = the refactor changed output; fix until identical.

- [ ] **Step 4: Run `/ays`, then commit**

```bash
git add js/quote-flow.js
git commit -m "refactor(quote): review renderer → data-driven build helpers (parity preserved)"
```

---

## Phase 2 — Restructure to flow-adaptive Editorial sections (markup + model + a11y semantics)

The big structural + visual phase. After it the review looks new, splits Cleaning/Porters, and is structurally faithful.

### Task 2.1: Editorial CSS component

**Files:** Modify `css/quote-noir.css` (add near the other `.qf2-sum-*` rules).

- [ ] **Step 1: Add the `.qf2-rv-editorial` component** (exact CSS from spec §4):

```css
.qf2-rv-group{ font-size:.66rem; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-dim); margin:1.4rem 0 .5rem; }
.qf2-summary.qf2-rv-editorial{ display:block; }
.qf2-summary.qf2-rv-editorial .qf2-sum-row{ display:grid; grid-template-columns:1fr auto; align-items:start; gap:.5rem; padding:.85rem 0; border:0; background:none; border-radius:0; }
.qf2-rv-editorial .qf2-sum-row:not([hidden]) ~ .qf2-sum-row:not([hidden]){ border-top:1px solid rgba(255,255,255,.09); }
.qf2-rv-editorial .qf2-sum-row-ico{ display:none; }
.qf2-rv-editorial .qf2-sum-row-label{ font-size:.7rem; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-dim); margin:0 0 .3rem; }
.qf2-rv-editorial .qf2-sum-row-value{ font-family:'Fraunces',serif; font-weight:300; font-size:1.18rem; color:var(--ink); line-height:1.3; }
.qf2-rv-editorial .qf2-sum-row-value .qf2-sec{ font-family:'Inter',sans-serif; font-size:.84rem; font-weight:300; color:var(--ink-dim); display:block; margin-top:.15rem; }
.qf2-rv-editorial .qf2-edit-btn{ font-size:.78rem; color:var(--accent); background:none; border:0; min-height:44px; display:inline-flex; align-items:center; }
.qf2-rv-editorial .qf2-edit-btn:focus-visible{ outline:2px solid var(--accent); outline-offset:3px; border-radius:6px; }
.qf2-rv-porters{ list-style:none; margin:.15rem 0 0; padding:0; }
.qf2-rv-porter{ display:flex; gap:.5rem; font-family:'Inter',sans-serif; font-size:.86rem; padding:.3rem 0; }
.qf2-rv-porter:not(:first-child){ border-top:1px solid rgba(255,255,255,.06); }
.qf2-rv-porter b{ color:var(--ink); font-weight:400; min-width:4.4rem; display:inline-block; }
.qf2-rv-porter span{ color:var(--ink-dim); font-weight:300; }
.qf2-rv-affirm{ font-family:'Inter',sans-serif; font-size:.86rem; font-weight:300; font-style:italic; color:var(--ink-dim); text-align:center; max-width:34rem; margin:.2rem auto 1.1rem; line-height:1.5; }
@media (max-width:879px){ .qf2-rv-editorial .qf2-sum-row-value{ font-size:1.08rem; } }
@media (min-width:880px){ .qf2-rv-editorial .qf2-sum-row-value{ font-size:1.18rem; } }
```

- [ ] **Step 2: Verify braces balance.** Run: `awk '{o+=gsub(/{/,"{");c+=gsub(/}/,"}")}END{print o"="c,o-c}' css/quote-noir.css` → equal, diff 0. (Commit with Task 2.3.)

### Task 2.2: New `<dl>` markup — flow-adaptive sections + group headings

**Files:** Modify `quote.html` (`.qf2-summary` block ~766-818).

- [ ] **Step 1: Replace the `<div class="qf2-summary">` block** with a `<dl class="qf2-summary qf2-rv-editorial">` containing six `.qf2-sum-row` rows (each `<dt class="qf2-sum-row-label">` + `<dd class="qf2-sum-row-value" id="...">` + `.qf2-edit-btn[data-edit]`), plus the affirmation line above and two group `<h3 class="qf2-rv-group">` headings wrapping their sections in `<section aria-labelledby>`. Sections + ids:
  - `service` (id `qf2SumService`, data-edit `service`)
  - `space-location` (id `qf2SumSpace` + sub `qf2SumWhere`, data-edit `space-location`)
  - group **SCHEDULE** (`<h3 id="qfGrpSchedule">`): `cleaning` (id `qf2SumCleaning`, data-edit `days`); `porters` (id `qf2SumPorters`, data-edit `schedule`)
  - group **YOU** (`<h3 id="qfGrpYou">`): `info` (id `qf2SumYou`, data-edit `info`); `extras` (id `qf2SumExtras`, data-edit `extras`)
  - Affirmation line: `<p class="qf2-rv-affirm" id="qf2RvAffirm" hidden></p>` right after the `.qf2-prompt` (~764).
  - Status node: `<div id="qf2SumStatus" role="status" aria-live="polite" class="sr-only"></div>` inside `.qf2-summary`.
  - Each Edit button keeps `aria-label="Edit <section>"`, add `aria-expanded="false"`.

  (Use `display:contents` on the `<dt>`/`<dd>` already handled by the grid rule; the row remains the grid container.)

- [ ] **Step 2: Bump cache-busters** in quote.html: `quote-noir.css?v=60`→`?v=61`, `quote-flow.js?v=39.19`→`?v=39.20`.

### Task 2.3: Model → six sections; split Cleaning/Porters; FIELD_TO_SECTION mirror; render loop into new ids

**Files:** Modify `js/quote-flow.js`.

- [ ] **Step 1: Expand the model** to the six descriptors with `when()`, `group`, `edit`, `build` (spec §1). `buildCleaning` ALWAYS reads `STATE.timeOfDay` (kills the 🔴). `buildPorters` returns a `porters:[{label,detail,aria}]` list; the loop renders it as `<ul class="qf2-rv-porters"><li aria-label>`. `buildExtras` returns situation/timeline lines (NOT notes). `when()` gates: cleaning `['janitorial','both'].includes(STATE.service)`, porters `['dayporter','both']`, extras `!!(STATE.situation||STATE.timeline)`.

- [ ] **Step 2: Render loop** sets each row `[hidden]=!when()`, builds, writes via `setStackedValue` (porters via the `<ul>` builder). Group `<h3>` `[hidden]` = no descriptor in that group has `when()===true`.

- [ ] **Step 3: Split the edit route.** In the edit dispatch (~3354+) the `days`/`schedule` `data-edit` values now route distinctly: `data-edit="days"`→`qfScreen_days`, `data-edit="schedule"`→`qfScreen_schedule`. Remove the flow-conditional `daysTarget` conflation (~3478).

- [ ] **Step 4: Fix `FIELD_TO_SECTION` (the 5th mirror, 4362-4366):**

```javascript
var FIELD_TO_SECTION = {
  email: 'info', name: 'info', phone: 'info',
  address: 'space-location', company: 'space-location', space: 'space-location', size: 'space-location',
  days: 'cleaning', dpDays: 'porters', porters: 'porters'
};
```

- [ ] **Step 5: Update the e2e that asserts old behavior.** In `both-flow.spec.js` test 3 (Edit on When → schedule), change the selector to the new Porter row (`[data-section="porters"]`) and assert it routes to `qfScreen_schedule`. Update the PARITY tests' "Cleaning · Monday" expectation to the new split (Cleaning row shows `Monday` + windows; Porter row shows `Porter 1`).

- [ ] **Step 6: Add the mirror test.** In `both-flow.spec.js`:

```javascript
test('failed submit with bad porter days focuses the Porter coverage row', async ({ page }) => {
  // reach review in both flow with a porter whose days were cleared, submit, assert
  // .qf2-sum-row[data-section="porters"] gets .is-editing (not 'schedule'/null).
});
```
(Fill the driver from existing patterns; the assertion target is `[data-section="porters"].is-editing`.)

- [ ] **Step 7: Run e2e + visual check** (preview all 3 flows at 390px + 1280px; confirm editorial layout, split sections, windows shown in Combined). Run `/ays`.

- [ ] **Step 8: Commit**

```bash
git add quote.html css/quote-noir.css js/quote-flow.js tests/e2e/both-flow.spec.js
git commit -m "feat(quote): editorial flow-adaptive review — split cleaning/porters, dl semantics, mirror fix"
```

---

## Phase 3 — Complete fidelity + dev guard

### Task 3.1: Preserve/restore every field + edge state

**Files:** Modify `js/quote-flow.js` (build helpers).

- [ ] **Step 1:** `buildSpace` — keep `spaceOther` substitution when `space==='Other'`, the `needsSiteWalk`/`visit_required`/`notsure` size override ("In-person visit"), the suite sub-line (`'Suite '+STATE.userSuite`), and the visit-indicator decorate. `buildYou` — keep `userPosition` sub-line + add `userPhone` sub-line when set. `buildService` — keep the `serviceCertainty==='guided_via_quiz'` badge decorate.
- [ ] **Step 2:** `unsure` service — `when()` for cleaning/porters already excludes it (service is `'unsure'`, not janitorial/both/dayporter) → those sections hide; Service caption shows "We'll help you choose".
- [ ] **Step 3: Tests** (extend specs): assert review shows job title + phone (when entered) + suite; assert a `visit_required` size shows "In-person visit" + the visit indicator; assert an `Other` space shows the typed text. Run e2e green.
- [ ] **Step 4: Run `/ays`, commit** `fix(quote): review fidelity — position, phone, suite, site-walk, Other, unsure`.

### Task 3.2: Live phone re-render + dev fidelity guard

**Files:** Modify `js/quote-flow.js`.

- [ ] **Step 1:** On `#qfUserPhone` input (~3321) also call `qf2PopulateSummary()` (debounced ~200ms) so the phone sub-line appears immediately.
- [ ] **Step 2: Add the dev guard** after the model is defined:

```javascript
// Dev-only: warn if a payload-shipped STATE key has no review section that reads it.
// Preview hosts only; console.warn (not log) — prod-safe per house rule.
(function () {
  try {
    var host = location.hostname;
    if (!(host === 'localhost' || host === '127.0.0.1' || host.indexOf('.pages.dev') > -1)) return;
    var SENT_KEYS = ['service','space','spaceOther','size','sizeExact','days','timeOfDay','dpDays','dpPorters','situation','timeline','companyName','userAddress','userSuite','userName','userLastName','userEmail','userPosition','userPhone','specialInstructions','needsSiteWalk','serviceCertainty'];
    var INTENTIONALLY_HIDDEN = ['source','porterCount','porterHours','scheduleAtypical','sizeExact','specialInstructions']; // notes = textarea; derived/internal
    var REVIEWED = QF2_REVIEWED_KEYS; // set the model exposes (keys each build reads)
    SENT_KEYS.forEach(function (k) {
      if (INTENTIONALLY_HIDDEN.indexOf(k) === -1 && REVIEWED.indexOf(k) === -1)
        console.warn('[review-fidelity] STATE.' + k + ' is sent but not shown in the review');
    });
  } catch (e) {}
})();
```
Expose `QF2_REVIEWED_KEYS` as a flat list of the STATE keys the build helpers read.
- [ ] **Step 3:** Verify the guard prints ZERO warnings on a fully-filled submit (preview console) across flows. Run `/ays`, commit `feat(quote): live phone re-render + dev fidelity guard`.

---

## Phase 4 — Conversion boosters

### Task 4.1: "What happens next" timeline + site-walk reframe

**Files:** Modify `quote.html` (insert ~862, before `#qfContactSubmit`), `js/quote-flow.js`.

- [ ] **Step 1:** Add a `<div class="qf2-rv-next">` 3-step strip (reuse the success-screen `.qf2-timeline` pattern at ~880-919, condensed): "Today — we prep your proposal" · "Within 24h — it lands in your inbox" · "Then — a quick call only if you want one." Add matching CSS (base+mobile+desktop) in quote-noir.css.
- [ ] **Step 2:** In `qf2PopulateSummary`, when `STATE.needsSiteWalk` set step 3 text to "Then — we schedule a free on-site walk"; upgrade `.qf2-visit-indicator` copy (~3115) to "We'll measure on-site so your proposal is exact — free, no obligation" and render it ONCE; lead `.qf2-cta-subtext` (~3151) with the benefit.
- [ ] **Step 3:** Visual check both viewports + e2e green. Run `/ays`, commit `feat(quote): review — what-happens-next timeline + free site-walk reframe`.

### Task 4.2: "Here's what we'll tailor" affirmation + 1-tap extras edit

**Files:** Modify `js/quote-flow.js`.

- [ ] **Step 1:** Populate `#qf2RvAffirm` from STATE: assemble flow-adaptive ("We'll size a crew from your 4,500 sq ft and your Mon–Fri window" / dayporter → porter count / both → both); `needsSiteWalk` → "once we've measured your space"; `hidden=false` only when there's content. XSS-safe via `textContent`.
- [ ] **Step 2:** Extras editing — `situation` Edit routeBack to `info` (`returnToReview='info'`); `timeline` Edit routeBack to `location`; show "Save — back to review" on the hop-back Save button when `returnToReview` set. (Inline chip upgrade optional if cheap.)
- [ ] **Step 3:** e2e: assert affirmation line renders for a both client; assert editing timeline returns to review. Run `/ays`, commit `feat(quote): review affirmation line + 1-tap extras editing`.

---

## Phase 5 — A11y behaviors, dead-code purge, ship

### Task 5.1: Focus return + aria-live + porter list a11y

**Files:** Modify `js/quote-flow.js`.

- [ ] **Step 1:** In every edit-panel close path (toggle ~3362, Cancel ~3466, Save ~3508) add `btn.focus()` after `btn.textContent='Edit'`; toggle `aria-expanded` on open/close; add `aria-controls` to the inserted panel.
- [ ] **Step 2:** At the end of `qf2PopulateSummary`, set `#qf2SumStatus.textContent='Review updated'` (and field-specific on edit-save).
- [ ] **Step 3:** Confirm porter `<li>` carry `aria-label` ("Porter 1, weekdays, 9 AM to 5 PM"); guard panel transitions behind `qfReducedMotion`.
- [ ] **Step 4:** Run `design:accessibility-review` (AYS Phase 7), e2e green. Commit `feat(quote): review a11y — focus return, aria-live, labeled porter list`.

### Task 5.2: Delete dead parallel renderer + temp mockups

**Files:** Modify `js/quote-flow.js`; delete `_review-mockup.html`, `_review-styles.html`.

- [ ] **Step 1: Confirm zero consumers** of the dead path: `grep -nE '#qfPlanHeroTitle|qf-rv-sum-dot|qf-rev-edit|qfSumName|qfSumEmail|qfSumPhone|data-edit="phone"' quote.html` → expect none in the live V2 review.
- [ ] **Step 2: Delete** `populateSummary` (~3564-3700), `formatPorters`/`formatTime`/`formatDays` (~3538-3558), the `qf-rev-*` wiring (~3797-3830), dead `qfEditSize`/`qfEditPhone` handlers (~3849-3962). After each deletion, `node --check js/quote-flow.js`.
- [ ] **Step 3: `git rm`** the temp mockups: `git rm _review-mockup.html _review-styles.html` (they were never committed — use `rm -f` instead).
- [ ] **Step 4: Run full e2e** — all green (proves nothing referenced the dead code). `node --check` clean. Commit `chore(quote): delete dead parallel review renderer + temp mockups`.

### Task 5.3: Final verification + ship

- [ ] **Step 1: Full e2e** `--project=desktop-chrome` — all green (existing + all new).
- [ ] **Step 2: Visual edge cases** (preview, 390px + 1280px): 6 porters w/ custom per-day hours; 500-char notes; very long company + address; visit-required; single porter; janitorial-only; Combined; `unsure`. Confirm editorial layout holds, nothing crammed, Edit routes, focus ring visible, affirmation + timeline render.
- [ ] **Step 3: Confirm cache-busters** bumped (quote-noir.css, quote-flow.js) on quote.html.
- [ ] **Step 4: Run `/ays`** (full gate). Address findings.
- [ ] **Step 5: Merge to main** only with explicit Alex OK (ff `combined-flow-redesign:main`); poll live HTML for the new `?v=`; ask Alex for the iPhone pass.

---

## Notes for the implementer

- **Parity first:** Phase 1's characterization tests are the safety net for the whole refactor — never let them go red except where Phase 2 intentionally changes the split (update the assertion in lockstep, per `feedback_wizard_reorder_mirror_obligations`).
- **Block scope:** the review code lives in `if (SCREENS.contact){…}`; helpers it calls (e.g. `formatSizeLabel`, `_porterLine`) must be in scope — verify before calling across blocks (`feedback_block_scoped_fn_sibling_if_block`).
- **One source of truth:** target `qf2PopulateSummary` (3047), NOT the dead `populateSummary` (3564) — delete the latter in Phase 5 (`feedback_blind_sed_copy_pass`).
- **XSS:** keep `textContent`/`createTextNode` everywhere (never `innerHTML` with STATE).
