# Quote Wizard — Review Page Redesign — Design (elevated)

**Date:** 2026-06-27 · **Status:** approved direction (pending final spec review)
**Elevated** after a 5-lens adversarial critique (conversion, architecture,
completeness QA, accessibility) that caught 2 latent regressions + a structural
upgrade. All four conversion additions approved by Alex.

## Goal

Rebuild the final review screen (`qfScreen_contact`) so it **faithfully shows
everything the client entered**, makes them hit "Send" with confidence, and is
**structurally incapable** of silently dropping a field again. Style: Editorial
(hairlines, no boxes, Fraunces serif values). Structure: flow-adaptive sections.

## 1. Architecture — data-driven section model (the core upgrade)

The 6 fidelity bugs share ONE root cause: the review is a hand-coded fixed-row
template with per-flow `if/else` branches in `qf2PopulateSummary`; a STATE field
that no row reads is silently dropped (the `both` branch at ~3266 literally never
reads `STATE.timeOfDay`). Imperative patches fix these 6 but guarantee the 7th
future field vanishes too.

**Replace the branches with a declarative descriptor array** so any provided field
is shown *by construction*:

```js
// module-level in js/quote-flow.js
const QF2_REVIEW_SECTIONS = [
  { section:'service',        group:null,       edit:'service',
    when:()=>true,            build:buildService /* + serviceCertainty badge decorate */ },
  { section:'space-location', group:null,       edit:'space-location',
    when:()=>true,            build:buildSpace   /* + needsSiteWalk visit decorate */ },
  { section:'cleaning',       group:'SCHEDULE',  edit:'days',
    when:()=>['janitorial','both'].includes(STATE.service), build:buildCleaning },
  { section:'porters',        group:'SCHEDULE',  edit:'schedule',
    when:()=>['dayporter','both'].includes(STATE.service),  build:buildPorters },
  { section:'info',           group:'YOU',       edit:'info',
    when:()=>true,            build:buildYou },
  { section:'extras',         group:'YOU',       edit:null /* sub-fields route individually */,
    when:()=>!!(STATE.situation || STATE.timeline), build:buildExtras },
];
```

`qf2PopulateSummary` becomes a loop: for each descriptor, if `!when()` set the row
`[hidden]`, else `build()` → `{label, primary, subs[]}` and call the **existing**
`setStackedValue` (keep it verbatim — preserves the `textContent`/`createTextNode`
XSS-safety and `.qf2-sec` sub-spans). Group labels render by scanning each group's
descriptors for any `when()===true`. The `both`-vs-janitorial branch collapses into
`buildCleaning` which **always** reads `timeOfDay` — killing the 🔴 by removing the
branch that could skip it.

**Dev-only fidelity guard.** Derive `REVIEWED_KEYS` (STATE keys each `build()` reads)
and `SENT_KEYS` (mirror of `buildSubmitPayload`'s fields). On load, gated to preview
hosts only (`location.hostname` includes `localhost` || `.pages.dev`), `console.warn`
any `SENT_KEYS` member not in `REVIEWED_KEYS` minus an explicit `INTENTIONALLY_HIDDEN`
allowlist (source attribution, honeypot, `scheduleAtypical`). This would have flagged
all 6 gaps pre-launch. Not a prod `console.log` (warn, preview-only) — house-rule safe.

## 2. Fidelity — COMPLETE (not just the 6)

The completeness QA found fields the first audit missed. The model must read all of:

| Field | STATE key | Where shown | Note |
|---|---|---|---|
| Service + caption | `service` | Service | `unsure` → "Help me decide" / "We'll help you choose" |
| Service-certainty badge | `serviceCertainty` | Service decorate | "We'll confirm the details." when `guided_via_quiz` |
| Company | `companyName` | Space primary | |
| Space type | `space` / `spaceOther` | Space sub | **use `spaceOther` when `space==='Other'`**, not literal "Other" |
| Size | `size` | Space sub | `formatSizeLabel`; `needsSiteWalk`/`visit_required`/`notsure` → "In-person visit" |
| Site-walk treatment | `needsSiteWalk` | Space decorate + CTA | visit indicator + CTA swap + subtext (see §3) |
| Address | `userAddress` | Space sub-value | |
| Suite | `userSuite` | Space sub-value | "Suite N" — **don't drop in the rewrite** |
| Cleaning days | `days` | Cleaning primary | `_fmtDayList`; fallback "—" if empty |
| Cleaning windows | `timeOfDay` | Cleaning subs | **`TIME_DETAIL`, rendered for `both` too** (the 🔴) |
| Porters | `dpPorters[]` | Porter coverage | one `<li>` per porter (see §4) |
| Name | `userName`+`userLastName` | Your details primary | |
| Email | `userEmail` | Your details sub | |
| **Job title** | `userPosition` | Your details sub | **shown today — would REGRESS if dropped** |
| Phone | `userPhone` | Your details sub | only if provided; live re-render (see §5) |
| Situation | `situation` | Anything else | new→"New space", switching→"Switching providers" |
| Timeline | `timeline` | Anything else | asap→"As soon as possible", weeks→"In a few weeks", exploring→"Just exploring" |
| Notes | `specialInstructions` | **textarea only** (single source) | do NOT echo a 2nd time — see §6 |

`service==='unsure'` per-flow behavior: show Service + Space + Your details +
(Anything else); **suppress Cleaning + Porter** (never collected on that path).

## 3. Conversion additions (all approved)

1. **"What happens next" micro-timeline on the review** — a compact 3-step strip
   between `.qf2-trust` and `#qfContactSubmit` (~862): "Today — we prep your proposal
   · Within 24h — it lands in your inbox · Then — a quick call only if you want one."
   `needsSiteWalk`-aware: step 3 → "Then — we schedule a free on-site walk". Reuse the
   success-screen timeline markup pattern (~880-919). Copy + one CSS class; no payload
   change.
2. **Site-walk reframe** — upgrade `.qf2-visit-indicator` (~3115) from "We'll see it
   in person." to "We'll measure on-site so your proposal is exact — free, no
   obligation," and lead the `.qf2-cta-subtext` (~3151) with the benefit. Render the
   indicator once (currently appears in two spots). Copy-only; existing CSS hooks.
3. **"Here's what we'll tailor" affirmation line** — one dynamic line under the
   review title (~759), assembled by the renderer from `formatSizeLabel(STATE.size)`,
   `_fmtDayList(STATE.days)`, `STATE.dpPorters.length`, `SERVICE_NAMES`. Flow-adaptive,
   each clause gated on presence; `needsSiteWalk` → "once we've measured your space".
   XSS-safe via `textContent`.
4. **One-tap situation/timeline editing** — see §6 (inline, no hop-back).

## 4. Editorial style + a11y-correct markup

Restyle `.qf2-summary` (add `qf2-rv-editorial`); keep `data-section` +
`.qf2-edit-btn[data-edit]` hooks. Look: no boxes, 1px hairlines, Fraunces serif
primary values, Inter uppercase labels (`--ink-dim`), muted subs, green Edit links,
green uppercase group labels. **But fix the a11y the critique flagged:**

- **Semantics:** make `.qf2-summary` a `<dl>`; each row wraps `<dt class="qf2-sum-row-label">`
  + `<dd class="qf2-sum-row-value">` (Edit button sibling). Keeps ids on the `<dd>` so
  the renderer is unchanged. Gives every value a programmatic name (WCAG 1.3.1) for free.
  Grid still works via `display:contents`/grid on dt/dd.
- **Group labels = real headings:** `<h3 class="qf2-rv-group">` (or `role="heading"
  aria-level="3"`), wrap each group's sections in `<section aria-labelledby>`. **Drop
  the `opacity:.62`** (it makes ~4.3:1, below AA) — use a solid token ≥4.5:1 (e.g.
  `--ink-dim` ~7.2:1, or full-opacity `--accent-soft` ~12.7:1).
- **Focus ring:** the borderless Edit link needs an explicit `:focus-visible{ outline:2px
  solid var(--accent); outline-offset:3px }` (the old ring relied on a border we remove).
  Preserve 44px tap area via padding.
- **Porter list:** render porters as `<ul class="qf2-rv-porters"><li>` each with an
  `aria-label` ("Porter 1, weekdays, 9 AM to 5 PM") so the visual `·` stays decorative.
- Hairline `rgba(255,255,255,.09)`; section visibility via `[hidden]` toggling (keeps
  edit listeners bound); the top-edge rule uses a sibling combinator so only non-first
  **visible** rows draw a top hairline (`:not([hidden]) ~ :not([hidden])`).

```css
.qf2-rv-group{ font-size:.66rem; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-dim); margin:1.4rem 0 .5rem; }
.qf2-summary.qf2-rv-editorial .qf2-sum-row{ display:grid; grid-template-columns:1fr auto; align-items:start; gap:.5rem; padding:.85rem 0; border:0; background:none; border-radius:0; }
.qf2-rv-editorial .qf2-sum-row:not([hidden]) ~ .qf2-sum-row:not([hidden]){ border-top:1px solid rgba(255,255,255,.09); }
.qf2-rv-editorial .qf2-sum-row-ico{ display:none; }
.qf2-rv-editorial .qf2-sum-row-label{ font-size:.7rem; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-dim); margin:0 0 .3rem; }
.qf2-rv-editorial .qf2-sum-row-value{ font-family:'Fraunces',serif; font-weight:300; font-size:1.18rem; color:var(--ink); line-height:1.3; }
.qf2-rv-editorial .qf2-sum-row-value .qf2-sec{ font-family:'Inter',sans-serif; font-size:.84rem; font-weight:300; color:var(--ink-dim); display:block; margin-top:.15rem; }
.qf2-rv-editorial .qf2-edit-btn{ font-size:.78rem; color:var(--accent); background:none; border:0; min-height:44px; }
.qf2-rv-editorial .qf2-edit-btn:focus-visible{ outline:2px solid var(--accent); outline-offset:3px; border-radius:6px; }
.qf2-rv-porters{ list-style:none; margin:.15rem 0 0; padding:0; }
.qf2-rv-porter{ display:flex; gap:.5rem; font-family:'Inter',sans-serif; font-size:.86rem; padding:.3rem 0; }
.qf2-rv-porter:not(:first-child){ border-top:1px solid rgba(255,255,255,.06); }
.qf2-rv-porter b{ color:var(--ink); font-weight:400; min-width:4.4rem; display:inline-block; }
.qf2-rv-porter span{ color:var(--ink-dim); font-weight:300; }
@media (max-width:879px){ .qf2-rv-editorial .qf2-sum-row-value{ font-size:1.08rem; } }
```

## 5. A11y behavior (bake-in)

- **Return focus** to the triggering Edit button on every panel close (toggle/Cancel/
  Save at ~3362/3466/3508 currently drop focus to `<body>` — WCAG 2.4.3). Add
  `aria-expanded` + `aria-controls` to the Edit button (mirror `#qf2PhoneOptinToggle`).
- **aria-live status:** add a visually-hidden `<div id="qf2SumStatus" role="status"
  aria-live="polite" class="sr-only">`; at the end of the renderer set "Review updated"
  / on edit-save the specific field — WCAG 4.1.3.
- **Live phone:** re-run the renderer (or re-render the info row) on `#qfUserPhone`
  input (~3321), debounced, so the phone sub-line appears the instant it's added.
- **Viewport-aware ARIA:** reuse `qfTouchFirst = matchMedia('(hover:none)')` (~396) and
  `qfReducedMotion` (~395) — don't add row-level interactive roles the keyboard can't
  reach; guard any panel transition behind reduced-motion.
- Notes/situation distinction for SR: `<span class="sr-only">Notes: </span>` prefix.

## 6. Edit model (resolved — no deferred decisions)

- `service` → existing service panel. `space-location` → existing space+address panel
  (note: space *type* is intentionally non-editable; address/suite/company editable).
- `cleaning` → routes to `qfScreen_days`. `porters` → routes to `qfScreen_schedule`.
  **Split the conflated route:** today the single "When" row (`data-edit="days"`)
  routes to `qfScreen_schedule` for both/dayporter (~3478). Give each its own route.
- **5th mirror — `FIELD_TO_SECTION` (~4362):** today maps `days`/`dpDays`/`porters` all
  to `data-section="schedule"`. **Must update in lockstep** to
  `{days:'cleaning', dpDays:'porters', porters:'porters', size:'space-location',
  company:'space-location', address:'space-location', email:'info', name:'info',
  phone:'info'}` or a failed-submit error scrolls to a now-nonexistent section (the
  exact CRIT-1 dead-end). Add an e2e: clear `dpDays`, Send, assert the Porter row enters
  `is-editing`.
- `info` → existing details panel; ensure `userPosition` shows + is editable there.
- **`extras` (resolved):** render up to 3 independently-editable lines — `situation`
  → `data-edit` routeBack to `info` (`returnToReview='info'`); `timeline` → routeBack to
  `location` (`returnToReview='location'`); `notes` stays the in-place `#qfSpecialInstructions`
  textarea (single source, no double-display). Reuses the `returnToReview` snap-back
  (~1233). (One-tap inline chips are a nice-to-have; routeBack is the lower-risk MVP and
  still single-purpose per field — plan may upgrade to inline chips if cheap.)
- **Phone edit:** reuse the existing phone opt-in expand (`#qf2PhoneOptinExpanded`)
  rather than adding phone to the info panel.
- **"Back to review" affordance:** when `returnToReview` is set, the hop-back Save button
  reads "Save — back to review" so the context-switch feels safe.

## 7. Cleanup (same commit)

Delete the dead parallel renderer `populateSummary` (~3564) + `formatPorters`/
`formatTime`/`formatDays` (~3538) + the `qf-rev-*` / `data-edit="phone"` wiring (~3797)
+ dead `qfEditSize`/`qfEditPhone` handlers (~3849-3962), after grepping `quote.html`
to confirm zero consumers of `#qfPlanHeroTitle`/`.qf-rv-sum-dot`/`.qf-rev-edit`/
`qfSum*` ids. Prevents the "edit the wrong function" hazard (`feedback_blind_sed_copy_pass`).

## 8. Footprint + cache busters

- `quote.html` — `<dl>` summary, flow-adaptive rows, group `<h3>`s, the what-happens-next
  strip, affirmation line, `sr-only` status node.
- `css/quote-noir.css` — `.qf2-rv-editorial` component → bump `?v` (+1).
- `js/quote-flow.js` — `QF2_REVIEW_SECTIONS` model + renderer loop, build* helpers, dev
  guard, `FIELD_TO_SECTION` fix, focus-return, aria-live, live-phone, conversion copy,
  dead-code purge → bump `?v` (+0.01).
- Delete `_review-mockup.html`, `_review-styles.html` before commit.

## 9. Testing

- **e2e (extend `both-flow.spec.js` + others):**
  - Combined review shows cleaning **windows** (🔴 regression test).
  - Separate **Cleaning** + **Porter coverage** sections; one line per porter.
  - **Job title**, **phone** (when entered), **suite** all appear.
  - Failed-submit with bad `dpDays` → focus lands on **Porter coverage** row (mirror).
  - Resumed-partial draft (e.g. `days=[]`) → no blank Fraunced value (fallback).
  - `unsure` service → no Cleaning/Porter sections.
  - Full suite stays green.
- **Visual (preview, 390px + 1280px):** 6 porters w/ custom per-day hours; 500-char
  notes; very long company + address; visit-required; single porter; janitorial-only;
  Combined. Confirm editorial layout holds, nothing crammed, Edit routes correctly,
  focus ring visible.
- **Fidelity guard** prints zero warnings for a fully-filled submit across all flows.

## 10. Out of scope

No new collected inputs. The educational-notes work (separate parked spec). Reworking
edit-panel internals beyond the routing/focus/mirror fixes above.
