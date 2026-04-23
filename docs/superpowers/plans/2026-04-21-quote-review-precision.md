# Quote Review Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dead `cleaningWindow` field across the stack and eliminate hardcoded/imprecise text from the quote review screen so every visible line reflects only data the user actually provided.

**Architecture:** Three surgical passes — (1) delete all `cleaningWindow` references in the frontend flow (`js/quote-flow.js`), (2) delete the matching backend mapping (`functions/api/submit-quote.js`), (3) replace assumed review copy with empty / fact-only strings and update DOM visibility for empty sub-rows.

**Tech Stack:** Vanilla JS (IIFE pattern, ES5-compatible), static HTML, Cloudflare Pages Functions (Node 18). No build step. Cache busters via `?v=` query string on script tags.

**Spec reference:** `docs/superpowers/specs/2026-04-21-quote-review-precision-design.md`

**Branch/worktree:** Working directly on `main` (changes are surgical, low risk, aligned with recent review-precision commits).

**Cache-buster sequence:** `quote-flow.js` is currently referenced in `quote.html:950` as `?v=25.3`. Task 1 bumps to `25.4`. Task 3 bumps to `25.5`. Do not skip bumps — Cloudflare Pages caches aggressively.

**Testing posture:** No unit-test suite exists for `quote-flow.js`. Verification is end-to-end via the Preview MCP: walk each of the four flows (janitorial / dayporter / both / unsure), inspect the rendered review DOM and the network payload at submit, confirm the absence of removed text and the absence of `window` in the JSON body.

---

## Task 1: Remove `cleaningWindow` from the frontend flow

**Files:**
- Modify: `js/quote-flow.js` (8 edits)
- Modify: `quote.html:950` (cache-buster bump)

- [ ] **Step 1: Remove the STATE field**

Locate:
```javascript
    timeEnd:        null,
    cleaningWindow: null,
    currentStepName: 'welcome',
```

Replace with:
```javascript
    timeEnd:        null,
    currentStepName: 'welcome',
```

- [ ] **Step 2: Remove the checkpoint block that reads `cleaningWindow`**

Locate (lines ~838-841):
```javascript
        if (STATE.cleaningWindow) {
          var winMap = { before_hours: 'before hours', after_hours: 'after hours', flexible: 'flexible timing' };
          parts.push(winMap[STATE.cleaningWindow] || STATE.cleaningWindow);
        }
```

Delete these four lines entirely. The surrounding `if (STATE.porterCount) { ... }` block at ~842 remains untouched.

- [ ] **Step 3: Remove the `formatWindow()` function**

Locate (lines ~1558-1562):
```javascript
    function formatWindow() {
      if (!STATE.cleaningWindow) return '';
      var map = { before_hours: 'Before hours', after_hours: 'After hours', flexible: 'Flexible' };
      return map[STATE.cleaningWindow] || STATE.cleaningWindow;
    }

```

Delete the entire function block (including the trailing blank line). `formatTime()` at ~1564 remains the next function.

- [ ] **Step 4: Remove the `window` entry from the error label map**

Locate (line ~1763):
```javascript
      window: 'cleaning window', days: 'schedule days', time: 'porter hours'
```

Replace with:
```javascript
      days: 'schedule days', time: 'porter hours'
```

- [ ] **Step 5: Remove the dead `field === 'window'` branch in the open-edit handler**

Locate (lines ~1798-1802):
```javascript
        } else if (field === 'porters') {
          document.getElementById('qfEditPorters').value = STATE.porterCount || '1';
        } else if (field === 'window') {
          document.getElementById('qfEditWindow').value = STATE.cleaningWindow || 'flexible';
        } else if (field === 'days') {
```

Replace with:
```javascript
        } else if (field === 'porters') {
          document.getElementById('qfEditPorters').value = STATE.porterCount || '1';
        } else if (field === 'days') {
```

- [ ] **Step 6: Remove the `STATE.cleaningWindow = null` reset in the service-change block**

Locate (lines ~1879-1884):
```javascript
            if (newService === 'janitorial' || newService === 'unsure') {
              STATE.porterCount = null;
              STATE.cleaningWindow = null;
              STATE.timeStart = null;
              STATE.timeEnd = null;
            }
```

Replace with:
```javascript
            if (newService === 'janitorial' || newService === 'unsure') {
              STATE.porterCount = null;
              STATE.timeStart = null;
              STATE.timeEnd = null;
            }
```

Only line 1881 is removed. The `porterCount`, `timeStart`, `timeEnd` resets stay.

- [ ] **Step 7: Remove the dead `field === 'window'` branch in the save-edit handler**

Locate (lines ~1888-1892):
```javascript
        } else if (field === 'porters') {
          STATE.porterCount = document.getElementById('qfEditPorters').value;
        } else if (field === 'window') {
          STATE.cleaningWindow = document.getElementById('qfEditWindow').value;
        } else if (field === 'days') {
```

Replace with:
```javascript
        } else if (field === 'porters') {
          STATE.porterCount = document.getElementById('qfEditPorters').value;
        } else if (field === 'days') {
```

- [ ] **Step 8: Remove the `payload.window` assignment**

Locate (lines ~1977-1979):
```javascript
      // Cleaning window (janitorial/both) — keep separate from porter hours
      if (STATE.cleaningWindow) payload.window = STATE.cleaningWindow;
```

Delete both lines (comment + code). The preceding line (end of porter-hours block) and following line remain untouched.

- [ ] **Step 9: Bump the cache buster for `quote-flow.js`**

In `quote.html:950`:
```html
<script src="js/quote-flow.js?v=25.3"></script>
```

Change to:
```html
<script src="js/quote-flow.js?v=25.4"></script>
```

- [ ] **Step 10: Verify no `cleaningWindow` reference remains in the frontend**

Run (Grep tool, not shell):
```
Pattern: cleaningWindow|formatWindow|qfEditWindow
Path: /Users/yoelvismercedes/Downloads/Ecco Webside/js/quote-flow.js
```

Expected: **zero matches**.

- [ ] **Step 11: Commit**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
git add js/quote-flow.js quote.html
git commit -m "$(cat <<'EOF'
refactor(quote): remove dead cleaningWindow field from frontend flow

The cleaningWindow state field was orphaned when the earlier redesign removed
the qfEditWindow control from the HTML. The field was always null in practice,
so payload.window was never sent and the related branches in the edit handlers
were dead code. Remove the STATE entry, the formatWindow helper, the checkpoint
recap branch, both dead edit handler branches, the service-change reset, the
payload assignment, and the error label map entry. Bump cache buster to 25.4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: pre-commit hook may trigger `/ays`. If it passes, commit succeeds.

---

## Task 2: Remove `cleaningWindow` mapping from the backend

**Files:**
- Modify: `functions/api/submit-quote.js` (4 edits)

- [ ] **Step 0: Remove `'window'` from the `ALLOWED_KEYS` allowlist**

Locate (lines ~141-146):
```javascript
    const ALLOWED_KEYS = new Set([
      'em','fn','ln','ph','co','addr','referral','notes','contactPref','formType',
      'space','spaceOther','urg','size','exactSize','janDays','addDayPorter','window',
      'hrs','customHrs','startTime','dpDays','porters','porterCount','dpAreas','areaOther','addJanitorial',
      'turnstileToken'
    ]);
```

Replace with:
```javascript
    const ALLOWED_KEYS = new Set([
      'em','fn','ln','ph','co','addr','referral','notes','contactPref','formType',
      'space','spaceOther','urg','size','exactSize','janDays','addDayPorter',
      'hrs','customHrs','startTime','dpDays','porters','porterCount','dpAreas','areaOther','addJanitorial',
      'turnstileToken'
    ]);
```

Rationale: defense-in-depth — even if a stale client ever sent `window`, the backend would now drop it rather than silently accept.

- [ ] **Step 1: Remove the KEY_MAP entry**

Locate (line ~224):
```javascript
      janDays: 'cleaning_days', addDayPorter: 'also_wants_dayporter',
      window: 'cleaning_window',
      // Day Porter
```

Replace with:
```javascript
      janDays: 'cleaning_days', addDayPorter: 'also_wants_dayporter',
      // Day Porter
```

- [ ] **Step 2: Remove the `WINDOW_MAP` constant**

Locate (lines ~232-234):
```javascript
    const WINDOW_MAP = {
      before_hours: 'Before hours', after_hours: 'After hours', flexible: 'Flexible'
    };
```

Delete the entire 3-line constant declaration. The preceding `URGENCY_MAP` (or whatever structure sits above) and following `formData` initialization remain intact.

- [ ] **Step 3: Remove the `window` branch in the formatter loop**

Locate (line ~244):
```javascript
      if (k === 'urg' && URGENCY_MAP[v]) value = URGENCY_MAP[v];
      else if (k === 'window' && WINDOW_MAP[v]) value = WINDOW_MAP[v];
      formData[label] = value;
```

Replace with:
```javascript
      if (k === 'urg' && URGENCY_MAP[v]) value = URGENCY_MAP[v];
      formData[label] = value;
```

- [ ] **Step 4: Verify no `window` reference remains in the backend handler**

Run (Grep tool):
```
Pattern: \bwindow\b|WINDOW_MAP|cleaning_window
Path: /Users/yoelvismercedes/Downloads/Ecco Webside/functions/api/submit-quote.js
```

Expected: **one match** at line ~63 (`// Bucket overshot by >2 (the typical race window size).`) — a comment about rate-limiting buckets, unrelated to cleaningWindow. Zero other matches.

- [ ] **Step 5: Commit**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
git add functions/api/submit-quote.js
git commit -m "$(cat <<'EOF'
refactor(api): drop cleaning_window mapping from submit-quote handler

The quote form no longer sends a window field (removed in the prior frontend
commit). Remove the KEY_MAP entry, the WINDOW_MAP constant, and the matching
branch in the formatter loop. The cleaning_window column in the lead table is
left intact for historical records; only the write path stops populating it.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Fix imprecise text in the review screen

**Files:**
- Modify: `quote.html:695` (static default text)
- Modify: `js/quote-flow.js` (janitorial/unsure + both schedule sub-text)
- Modify: `quote.html:950` (cache-buster bump)

- [ ] **Step 1: Blank out the static `qfSumTime` / `qfRvSchedMeta` defaults in HTML**

Locate in `quote.html` (line ~695):
```html
              <div class="qf-rv-sum-sub" id="qfRvSchedSub"><span id="qfSumTime">after-hours window</span><span class="qf-rv-sum-dot" id="qfRvSchedDot">·</span><span id="qfRvSchedMeta">onboarding week 1</span></div>
```

Replace with:
```html
              <div class="qf-rv-sum-sub" id="qfRvSchedSub" hidden><span id="qfSumTime"></span><span class="qf-rv-sum-dot" id="qfRvSchedDot" hidden>·</span><span id="qfRvSchedMeta" hidden></span></div>
```

Changes: default text removed from all three spans; parent div gets `hidden` attribute so nothing flashes during initial paint; inner `qfRvSchedDot` and `qfRvSchedMeta` also marked `hidden` (the JS already hides them; setting the default matches).

- [ ] **Step 2: Replace janitorial/unsure schedSub with empty string AND hide parent when empty**

Locate in `js/quote-flow.js` (lines ~1683-1684):
```javascript
      if (svc === 'janitorial' || svc === 'unsure') {
        schedSubText = 'After-hours window \u00b7 onboarding week 1';
      } else if (svc === 'dayporter') {
```

Replace with:
```javascript
      if (svc === 'janitorial' || svc === 'unsure') {
        schedSubText = '';
      } else if (svc === 'dayporter') {
```

- [ ] **Step 3: Remove the "After-hours janitorial" seed in the `both` branch**

Locate in `js/quote-flow.js` (lines ~1688-1692):
```javascript
      } else if (svc === 'both') {
        var subBits = ['After-hours janitorial'];
        if (timeWin) subBits.push('porter on-site ' + timeWin);
        else subBits.push('porter on-site business hours');
        schedSubText = subBits.join(' \u00b7 ');
      }
```

Replace with:
```javascript
      } else if (svc === 'both') {
        schedSubText = timeWin ? ('porter on-site ' + timeWin) : 'porter on-site business hours';
      }
```

Rationale: the only fact we know about `both` schedule beyond days is the porter time window. "After-hours janitorial" is an unfounded assumption.

- [ ] **Step 4: Handle the empty-sub case by toggling `#qfRvSchedSub.hidden`**

Locate in `js/quote-flow.js` the line right after the schedSub assignment (~line 1694):
```javascript
      setVal('qfSumTime', schedSubText);
      var schedMeta = document.getElementById('qfRvSchedMeta');
      if (schedMeta) schedMeta.hidden = true; // we fold the meta into sub text above
      var schedDot = document.getElementById('qfRvSchedDot');
      if (schedDot) schedDot.hidden = true;
```

Replace with:
```javascript
      // Hide the whole sub-row when there's no factual schedule context to show
      // (janitorial / unsure have no captured time window). Bypass setVal so the
      // '—' fallback isn't written to qfSumTime when schedSubText is empty.
      var schedTimeEl = document.getElementById('qfSumTime');
      if (schedTimeEl) schedTimeEl.textContent = schedSubText;
      var schedSubEl = document.getElementById('qfRvSchedSub');
      if (schedSubEl) schedSubEl.hidden = !schedSubText;
      var schedMeta = document.getElementById('qfRvSchedMeta');
      if (schedMeta) schedMeta.hidden = true; // we fold the meta into sub text above
      var schedDot = document.getElementById('qfRvSchedDot');
      if (schedDot) schedDot.hidden = true;
```

Rationale: `setVal` defaults empty strings to the `—` em-dash fallback. Writing `textContent` directly preserves a true empty, and hiding the parent div removes the empty row from layout.

- [ ] **Step 5: Bump the cache buster for `quote-flow.js`**

In `quote.html:950`:
```html
<script src="js/quote-flow.js?v=25.4"></script>
```

Change to:
```html
<script src="js/quote-flow.js?v=25.5"></script>
```

- [ ] **Step 6: Verify no assumption strings remain in the review logic**

Run (Grep tool):
```
Pattern: After-hours window|onboarding week|After-hours janitorial|after-hours window
Path: /Users/yoelvismercedes/Downloads/Ecco Webside
```

Expected: **zero matches** in `quote.html` and `js/quote-flow.js`. (Matches in `.dead-archive/`, `.backup-*/`, or `quote.backup.html` are acceptable and should be ignored.)

- [ ] **Step 7: Commit**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
git add quote.html js/quote-flow.js
git commit -m "$(cat <<'EOF'
fix(quote): remove assumed text from review schedule sub-row

The review previously rendered hardcoded "After-hours window · onboarding
week 1" for janitorial/unsure and seeded "After-hours janitorial" for both —
neither was ever confirmed by the user. Replace with an empty sub for
janitorial/unsure (parent div hidden when no text), and leave only the
verifiable porter time window for the both flow. Bypass setVal for
qfSumTime so the em-dash fallback doesn't fire on empty strings. Bump cache
buster to 25.5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: End-to-end verification via Preview MCP

**Files:** none modified in this task — observation only.

- [ ] **Step 1: Start the preview server**

Use `mcp__Claude_Preview__preview_start` pointing at the project root. The `.claude/launch.json` config already defines a Node server on port 8080.

- [ ] **Step 2: Navigate to the quote page**

Use `mcp__Claude_Preview__preview_eval`:
```javascript
window.location.href = 'http://localhost:8080/quote.html';
```

Then `preview_console_logs` to confirm no errors at boot.

- [ ] **Step 3: Walk the janitorial flow**

Click through: `Janitorial` → fill name/email → fill address → pick `Office` space → pick `3K-6K` size → select `Mon-Fri` preset → (checkpoint auto-advances) → review screen.

Run `preview_snapshot` on the review section. Verify:
- Schedule row shows `Mon–Fri` as primary
- Schedule row sub-text is **not visible** (div is hidden)
- No occurrence of `after-hours window` or `onboarding week` strings anywhere on screen

Run `preview_eval`:
```javascript
JSON.stringify({
  hasCleaningWindow: 'cleaningWindow' in (window.__QF_STATE__ || {}),
  schedSubHidden: document.getElementById('qfRvSchedSub').hidden,
  schedSubText: document.getElementById('qfSumTime').textContent
});
```

(If `__QF_STATE__` is not exposed, skip the STATE inspection and rely on DOM.)

Expected: `schedSubHidden: true`, `schedSubText: ""`.

- [ ] **Step 4: Walk the dayporter flow**

Reset with `preview_eval: window.location.reload()`, then click: `Day Porter` → name/email → address → `Retail` space → `Mon-Fri` preset → `2 porters` → `08:00` start / `17:00` end → review.

Verify Schedule sub-text reads `On-site 08:00–17:00 · 2 porters`. The row should be visible (not hidden).

- [ ] **Step 5: Walk the `both` flow**

Reload, click `Both` → fill through to review. Pick `1 porter`, `07:00`–`19:00`.

Verify Schedule sub-text reads `porter on-site 07:00–19:00` — **no** preceding `After-hours janitorial` phrase.

- [ ] **Step 6: Walk the `unsure` flow**

Reload, click `Help me decide` → fill through to review.

Verify:
- Service row shows `Help me decide · Alina will recommend`
- Schedule row shows only days as primary, sub-text hidden
- No assumption strings anywhere

- [ ] **Step 7: Inspect the submit payload**

Still in any flow, open a `preview_network` monitor, then trigger submit. Find the `POST /api/submit-quote` entry and inspect the request body.

Verify:
- Body JSON does **not** contain a `window` key
- All user-provided fields (em, fn, ln, addr, space, size, janDays or dpDays, porters, startTime, hrs) are present for the active flow

- [ ] **Step 8: Repo-wide final grep**

Run (Grep tool) one more time:
```
Pattern: cleaningWindow|WINDOW_MAP|cleaning_window|formatWindow|qfEditWindow
Path: /Users/yoelvismercedes/Downloads/Ecco Webside
Exclude: .dead-archive, .backup-*, quote.backup.html, quote-flow.backup.js
```

Expected: zero matches in live source. Matches in archive/backup paths are acceptable.

- [ ] **Step 9: Check CSS / JS versions are in sync with cache busters**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
grep -n "quote-flow.js?v=" quote.html
```

Expected: single match reading `?v=25.5`.

- [ ] **Step 10: If everything passes, no further commits needed**

Task 1 and Task 3 already committed the JS/HTML changes; Task 2 committed the backend change. Verification does not modify source, so no commit here unless a regression was fixed.

If a regression surfaced, fix it inline, re-run the relevant verification steps, and commit with a descriptive message.

---

## Self-Review Results

**Spec coverage:**
- Part 1 (Remove cleaningWindow, 11 points) → Tasks 1 and 2 cover all 11 points (8 in JS, 3 in backend). ✅
- Part 2 (Fix imprecise text, 3 locations) → Task 3 Steps 1-4. ✅
- Part 3 (Precision audit per flow) → Task 4 Steps 3-6 verify each flow. ✅
- Part 4 (What stays) → not a change; implicit non-goal. ✅

**Placeholder scan:** No TBDs, no "add appropriate X", no "similar to Task N". Each code block contains the exact text to locate and the exact replacement. ✅

**Type consistency:** Field names (`cleaningWindow`, `STATE.timeStart`, `qfSumTime`, `qfRvSchedSub`) match across all tasks. Method/function names (`setVal`, `formatWindow`, `populateSummary`) are used consistently. Cache-buster values progress 25.3 → 25.4 → 25.5 across Tasks 1 and 3. ✅

**No gaps between tasks:** Task 1 handles all JS cleanup for `cleaningWindow`. Task 2 handles all backend cleanup. Task 3 handles the imprecise text (which would be visually wrong even after Task 1 since `schedSubText` was hardcoded, not data-driven). Task 4 is verification-only. No step depends on code that no prior task creates. ✅
