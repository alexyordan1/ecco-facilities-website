# Quote Review Precision — Design

**Date:** 2026-04-21
**Topic:** Remove `cleaningWindow` and eliminate imprecise text from the quote review screen
**Status:** Approved

## Context

The quote wizard (`quote.html` + `js/quote-flow.js`) asks users 22 distinct data points across 4 flows (janitorial / dayporter / both / unsure) and surfaces them in a review screen before submit. An exhaustive mapping revealed two problems:

1. `cleaningWindow` is defined in STATE, referenced in 9 places, and mapped on the backend — but the HTML control (`qfEditWindow`) was removed in an earlier redesign. The field is effectively dead code: `STATE.cleaningWindow` is always `null` in production, so `payload.window` is never sent, yet the review still renders hardcoded text **"After-hours window · onboarding week 1"** as if this data were captured and promised.
2. The `both` flow's schedule sub-text hardcodes **"After-hours janitorial"**, another assumption the wizard never asks the user to confirm.

These imprecisions violate the stated goal: the review must accurately reflect what the user actually answered — nothing invented, nothing missing.

## Goal

Every line in the review screen reflects data the user explicitly provided. No hardcoded promises, no assumed preferences, no dead fields in the payload.

## Scope

Three files, 11 removal points, 3 text precision fixes.

### Files touched

| File | Purpose |
|---|---|
| `js/quote-flow.js` | Frontend state, flow logic, review population |
| `quote.html` | Review screen markup defaults |
| `functions/api/submit-quote.js` | Backend payload mapping |

## Non-goals

- No changes to the questions asked by the wizard (no adds, no removes, no reorders)
- No changes to layout, typography, or the four thematic groups (Service / Premises / Schedule / Contact)
- No changes to edit-in-place affordances, chips, hero, trust strip, or send button
- No changes to the payload except removing the never-populated `window` key
- No UX copy rewrites beyond what's needed to remove imprecise/hardcoded text

## Changes

### Part 1 — Remove `cleaningWindow` completely

| # | File | Line | Removal |
|---|---|---|---|
| 1 | `js/quote-flow.js` | 156 | `cleaningWindow: null` from STATE object |
| 2 | `js/quote-flow.js` | 838-841 | Checkpoint recap block that reads `STATE.cleaningWindow` |
| 3 | `js/quote-flow.js` | 1558-1562 | `formatWindow()` function definition (dead) |
| 4 | `js/quote-flow.js` | 1763 | `window: 'cleaning window'` entry in error label map |
| 5 | `js/quote-flow.js` | 1800-1801 | `else if (field === 'window')` branch in open-edit handler (dead — no DOM element) |
| 6 | `js/quote-flow.js` | 1881 | `STATE.cleaningWindow = null` reset when service changes to janitorial/unsure. **Only this one line** — the surrounding `porterCount`, `timeStart`, `timeEnd` resets at 1880, 1882, 1883 must stay intact |
| 7 | `js/quote-flow.js` | 1890-1891 | `else if (field === 'window')` branch in save-edit handler (dead — no DOM element) |
| 8 | `js/quote-flow.js` | 1978-1979 | `if (STATE.cleaningWindow) payload.window = STATE.cleaningWindow;` |
| 9 | `functions/api/submit-quote.js` | 143 | `'window'` entry in `ALLOWED_KEYS` allowlist (defense-in-depth — drops stale client payloads) |
| 10 | `functions/api/submit-quote.js` | 224 | `window: 'cleaning_window'` entry in KEY_MAP |
| 11 | `functions/api/submit-quote.js` | 232-234 | `WINDOW_MAP` constant |
| 12 | `functions/api/submit-quote.js` | 244 | `else if (k === 'window' && WINDOW_MAP[v])` branch in formatter loop |

Line numbers correspond to the working copy at time of spec. Actual edits must re-locate by content to stay robust.

### Part 2 — Fix imprecise / assumed text in review

| Location | Current (imprecise) | Fix |
|---|---|---|
| `quote.html:695` static defaults | `<span id="qfSumTime">after-hours window</span><span id="qfRvSchedDot">·</span><span id="qfRvSchedMeta">onboarding week 1</span>` | Blank text nodes (`<span id="qfSumTime"></span>` etc.) so nothing is shown until JS paints real data |
| `quote-flow.js:1684` janitorial/unsure branch | `schedSubText = 'After-hours window · onboarding week 1';` | `schedSubText = '';` (no sub-text — the primary already shows the days, which is all we know). **Note:** `setVal('qfSumTime', '')` currently falls back to `—` because `'' \|\| '\u2014'` evaluates to `—`. To produce a truly empty sub-row, also hide the parent `#qfRvSchedSub` div (or each child span) when `schedSubText === ''`. The implementation must explicitly handle the empty case — either by adding `var schedSubEl = document.getElementById('qfRvSchedSub'); if (schedSubEl) schedSubEl.hidden = !schedSubText;` right after `setVal('qfSumTime', ...)`, or by bypassing `setVal` for this field and assigning textContent directly |
| `quote-flow.js:1688-1692` both branch | `var subBits = ['After-hours janitorial']; if (timeWin) subBits.push('porter on-site ' + timeWin); else subBits.push('porter on-site business hours'); schedSubText = subBits.join(' · ');` | Remove the `'After-hours janitorial'` seed. Resulting sub-text is just `'porter on-site HH:MM–HH:MM'` (or `'porter on-site business hours'` if no times captured) |

### Part 3 — Precision audit per flow (no changes, verification only)

After Parts 1 and 2 are applied, each flow's review reflects exclusively data the user provided:

| Flow | Service row | Premises row | Schedule row | Contact row |
|---|---|---|---|---|
| **janitorial** | `Janitorial · {N}× weekly` (from days count) | address + space + size | days (no sub) | name · company · email · phone |
| **dayporter** | `Day Porter · {N} porter(s)` | address + space (no size) | days + `On-site HH:MM–HH:MM · {N} porter(s)` | name · company · email · phone |
| **both** | `Both services · {N} porter(s) + {N}× janitorial` | address + space + size | days + `porter on-site HH:MM–HH:MM` | name · company · email · phone |
| **unsure** | `Help me decide` + `Alina will recommend` | address + space + size | days (no sub) | name · company · email · phone |

Marketing sub-copy that survives (per approval): `svcSub` strings like `"Eco-certified · insured · uniformed team"` — these describe the company's capabilities, not user-specific promises, and remain factual.

## Risk assessment

- **Low risk.** All 11 removal points are either dead code (no DOM element referenced) or guarded by an always-false condition (`STATE.cleaningWindow` is always `null` in the current HTML). The review text fixes are pure content changes with no behavior implication.
- **Backend compatibility:** Removing the `window` key and its mapping cannot break existing payloads because current payloads never include `window`. Any historical leads in the database already stored via the mapping remain unchanged; only future writes stop using the label.
- **No database migration needed.** The column itself is not altered in this spec.

## Verification

Before claiming done, the implementation must demonstrate for each of the four flows:

1. No hardcoded `"after-hours window"`, `"onboarding week 1"`, or `"After-hours janitorial"` text appears in the rendered review (DOM inspection)
2. The `payload` object at submit time does not contain a `window` key (console logging or network tab)
3. `STATE.cleaningWindow` does not exist as a property of the STATE object
4. `formatWindow`, `qfEditWindow`, and `WINDOW_MAP` return zero occurrences in a repo-wide grep
5. Every visible line in the review corresponds to a data point the user provided or factual marketing copy — nothing assumed
6. Form submit still succeeds end-to-end and the lead lands in the CRM with all expected fields

Run on desktop and mobile, using Preview tools. Test each flow (janitorial / dayporter / both / unsure) through submit.
