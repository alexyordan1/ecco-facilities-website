# Quote Wizard — Review Page Redesign — Design

**Date:** 2026-06-27 · **Status:** approved (pending spec review)

## Goal

Rebuild the final review screen (`qfScreen_contact` summary) so it **faithfully
shows everything the client entered**, adapts to the flow, and reads premium.
Two problems drove this, both confirmed by an adversarial 3-flow audit:

1. **Fidelity** — several entered fields are captured + sent in the payload but
   never shown back to the client, so they can't verify them before submitting.
2. **Format** — all scheduling is crammed into one "When" row via `<br>` sub-spans.

**Chosen style:** Editorial (hairline dividers, no card boxes, Fraunces serif for
primary values, airy). **Chosen structure:** flow-adaptive sections.

## Confirmed fidelity gaps (all must be fixed)

From the audit (`review-fidelity-audit`, 6 agents, adversarially verified):

| Sev | Field | STATE key | Current | Fix |
|---|---|---|---|---|
| 🔴 | Phone | `userPhone` | collected + sent, **never shown** | show in "Your details" when provided |
| 🔴 | Cleaning time windows (Combined) | `timeOfDay` | dropped in `both` branch (line 3266-3270) | render windows in the Cleaning section for both/janitorial |
| 🟠 | Special instructions | `specialInstructions` | textarea only, not in summary | echo in "Anything else" when provided |
| 🟡 | Situation (new/switching) | `situation` | sent, never shown | show in "Anything else" when provided |
| 🟡 | Timeline (asap/weeks/exploring) | `timeline` | sent, never shown | show in "Anything else" when provided |
| 🟡 | Square footage | `size` | buried fragment | its own sub-line in "The space" |

## Structure — flow-adaptive sections

Sections render in this order; each appears **only when relevant** (never an empty
row):

1. **The service** — name + caption. (all flows)
2. **The space** — company / `type · size` / address + suite. (all flows; `size`
   only for janitorial/both — dayporter has no size step)
3. *group: SCHEDULE*
   - **Cleaning** — days + windows. (janitorial / both)
   - **Porter coverage** — one line per porter. (dayporter / both)
4. *group: YOU*
   - **Your details** — name / email / phone (phone if provided).
   - **Anything else** — situation · timeline / notes. (only if any provided)

Per flow:
- **janitorial:** Service, Space, Cleaning, Your details, (Anything else)
- **dayporter:** Service, Space, Porter coverage, Your details, (Anything else)
- **both:** Service, Space, Cleaning, Porter coverage, Your details, (Anything else)

Group labels (SCHEDULE, YOU) render only when their group has ≥1 visible section.

## Editorial style

Restyle the existing `.qf2-summary` / `.qf2-sum-row` (keep the structural hooks
`data-section` + `.qf2-edit-btn[data-edit]` so edit wiring barely changes). New
look:

- **No card boxes.** Each row separated by a 1px hairline (`rgba(255,255,255,.09)`).
- **Label:** Inter, `.7rem`, weight 500, uppercase, letter-spacing `.1em`, `--ink-dim`.
- **Primary value:** Fraunces serif, weight 300, `~1.18rem`, `--ink`.
- **Sub-lines:** Inter, `.84rem`, weight 300, `--ink-dim`.
- **Edit:** text link, `--accent` (green), right-aligned on the label row.
- **Group label:** Inter, `.64rem`, uppercase, `--accent-soft` at ~62% opacity.
- **Porter line:** `Porter N` (Inter 500, `--ink`, fixed ~4.4rem width) + days
  (`--ink`) + ` · ` + hours (`--ink-dim`). One row per porter, never a `<br>` wall.

Base CSS (drawn from the approved mockup `_review-mockup.html` / Style A in
`_review-styles.html`; new component lives in `css/quote-noir.css`):

```css
.qf2-rv-group{ font-size:.64rem; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--accent-soft); opacity:.62; margin:1.4rem 0 .5rem; }
.qf2-summary.qf2-rv-editorial .qf2-sum-row{ display:grid; grid-template-columns:1fr auto; align-items:start; gap:.5rem; padding:.85rem 0; border:0; border-top:1px solid rgba(255,255,255,.09); background:none; border-radius:0; }
.qf2-summary.qf2-rv-editorial .qf2-sum-row:first-child{ border-top:0; }
.qf2-rv-editorial .qf2-sum-row-ico{ display:none; }                 /* editorial drops the per-row icon */
.qf2-rv-editorial .qf2-sum-row-label{ font-size:.7rem; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-dim); margin:0 0 .3rem; }
.qf2-rv-editorial .qf2-sum-row-value{ font-family:'Fraunces',serif; font-weight:300; font-size:1.18rem; color:var(--ink); line-height:1.3; }
.qf2-rv-editorial .qf2-sum-row-value .qf2-sec{ font-family:'Inter',sans-serif; font-size:.84rem; font-weight:300; color:var(--ink-dim); display:block; margin-top:.15rem; }
.qf2-rv-editorial .qf2-edit-btn{ font-size:.78rem; color:var(--accent); background:none; border:0; }
.qf2-rv-porter{ display:flex; gap:.5rem; font-size:.86rem; font-family:'Inter',sans-serif; }
.qf2-rv-porter b{ color:var(--ink); font-weight:400; min-width:4.4rem; display:inline-block; }
.qf2-rv-porter span{ color:var(--ink-dim); font-weight:300; }
.qf2-rv-note{ font-style:italic; }
@media (max-width:879px){ .qf2-rv-editorial .qf2-sum-row-value{ font-size:1.08rem; } }
```

(Exact selectors finalized in the plan; the existing `.qf2-sum-row` rules in
quote-noir.css get the `.qf2-rv-editorial` override scope so we don't disturb any
other consumer.)

## Markup changes (`quote.html`)

Inside `.qf2-summary` (add class `qf2-rv-editorial`), replace the 4 fixed rows with
the flow-adaptive set. Keep `data-section` + `data-edit` on each. New sections:
`cleaning` (data-edit="days"), `porters` (data-edit="schedule"), `extras`
(data-edit="extras"). Group-label `<div class="qf2-rv-group">` elements with a
`data-group` so JS can show/hide them.

## JS changes (`qf2PopulateSummary`, js/quote-flow.js ~3044-3300)

- **Split the "When" row** into **Cleaning** and **Porter coverage** rows.
- **Cleaning:** days (`_fmtDayList`) + windows (`STATE.timeOfDay` → `TIME_DETAIL`).
  **Render windows for `both` too** — fixes the 🔴 bug (today the `both` branch at
  ~3266 builds timeSubs from porters only).
- **Porter coverage:** one `.qf2-rv-porter` line per porter (reuse `_porterLine`
  logic, split label/days/hours into spans instead of one string).
- **Your details:** add phone line when `STATE.userPhone`.
- **Anything else:** build from `STATE.situation` (New/Switching), `STATE.timeline`
  (ASAP/A few weeks/Exploring), `STATE.specialInstructions`. Render the row only if
  ≥1 present. Notes shown italic.
- **Size:** ensure it shows as its own sub-line in The space (already via
  `formatSizeLabel`; verify for both/janitorial, omit for dayporter).
- **Show/hide sections per flow** + show/hide group labels when their group is empty.

## Edit model (reuse existing infrastructure)

The inline edit-panel system already wires `data-edit` → a panel/route for
`service`, `info`, `space-location`, `days`. Extend minimally:

- `service` → existing service panel.
- `space-location` → existing space + address panel.
- `cleaning` → routes to `qfScreen_days` (cleaning days + windows).
- `porters` → routes to `qfScreen_schedule` (porter days + hours).
  ⚠️ **Split the conflated route:** today the single "When" row uses
  `data-edit="days"` and the handler routes it to `qfScreen_schedule` for the
  both/dayporter flows. Now that Cleaning and Porters are separate rows, each needs
  its OWN route — Cleaning→days, Porters→schedule — and the flow-conditional
  conflation must be removed. Update the edit handler + the both-flow e2e test
  (test 3 currently asserts the old conflated behavior).
- `info` → existing details panel; ensure phone is editable there or via the
  existing phone opt-in on the review.
- `extras` → **decision:** notes stays the existing inline textarea on the review
  (already editable in place); situation/timeline get an inline mini-panel OR
  hop-back to their screens (info/location) using the existing `STATE.returnToReview`
  mechanism (goNext line ~1243). Plan picks the lower-risk path during implementation.

## Footprint

- `quote.html` — restructured summary markup (+ `qf2-rv-editorial` class, new rows,
  group labels).
- `css/quote-noir.css` — the `.qf2-rv-editorial` editorial component → bump
  `quote-noir.css ?v` (+1).
- `js/quote-flow.js` — `qf2PopulateSummary` rewrite of the row population + edit
  wiring for new sections → bump `quote-flow.js ?v` (+0.01).
- Delete temp mockups `_review-mockup.html`, `_review-styles.html` before commit.

## Accessibility

- Section order = reading order; group labels are non-interactive text.
- Edit links keep `aria-label` ("Edit <section>").
- Hairlines are decorative; values carry semantic text.
- Contrast: Fraunces `--ink` value + `--ink-dim` subs on the dark bg — verify ≥4.5:1
  (AYS Phase 7). Touch targets: Edit links ≥44px tap area.

## Testing

- e2e: extend `both-flow.spec.js` — assert the review shows the cleaning **windows**
  (regression test for the 🔴 bug), a **Cleaning** section AND a **Porter coverage**
  section, and (when entered) **phone** + **notes**. Add a janitorial assertion that
  windows show. Full suite must stay green.
- Visual: preview all 3 flows at 390px + 1280px; confirm the editorial layout, every
  entered field visible, porters one-per-line, nothing crammed, Edit routes correctly.

## Out of scope

Changing what's collected (no new inputs). Reworking the edit *panels'* internals
beyond routing the new sections. The educational-notes work (separate parked spec).
