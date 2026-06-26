# Quote wizard — service-cue labeling (fix the Combined confusion)

**Date:** 2026-06-26 · **Branch:** `combined-flow-redesign` · **Status:** awaiting Alex's review

## Problem

The quote wizard sells two services with **fundamentally different buying models**, and the Combined flow conflates them (Alex — the creator — got confused too):

- **Commercial / Night Cleaning = by result.** Customer gives **days**; Ecco decides the time/crew from the **space size**. The customer never picks a duration.
- **Day Porter = by presence.** Customer picks the **coverage hours** — that's what they're buying.

In Combined the cleaning `days` screen and the porter `schedule` screen run back-to-back with no cue telling the user *which service this is* or *who decides the time*. "Days I want cleaning" blurs with "hours I want a porter."

The flow **structure is already correct** (`both: space → size → days → schedule → …`). This is a **framing/labeling** change, not a re-architecture.

## Design — a consistent service-cue system

One pair of cues, used everywhere:

- 🧹 **Cleaning cue** (green, `--accent`): badge "YOUR CLEANING" + one-liner *"Pick the days — we size the crew & hours from your space."* Applied to the `size` and `days` screens.
- 🧍 **Day Porter cue** (blue, new token `--accent-porter`): badge "YOUR DAY PORTER" + one-liner *"You choose the hours — a porter on-site through your day."* Applied to the `schedule` screen.

Behavior per flow:
- **Cleaning (standalone):** size/days screens carry the green cue. (Reinforces "we decide the time".)
- **Day Porter (standalone):** schedule screen carries the blue cue.
- **Combined:** identical cues + a small progress sub-label so it reads as **🧹 then 🧍** — e.g. on the cleaning screens "Cleaning · 1 of 2", on schedule "Day Porter · 2 of 2". No new screens, no reordering.

The badge sits above the existing `.qf2-prompt` title; the one-liner sits just under it. Both viewports. The cue is purely additive — it does not change any input, validation, or payload.

## Also in scope — **E** (the data side of the same confusion)

Bug E: in Combined, editing cleaning days at Review leaves the **porter days stale** → contradictory schedules shipped to sales. Fix (Alex-approved option **a**): porter days **follow** the cleaning days **until the user customizes them**.
- Add `STATE.dpDaysCustomized` (set true when the user edits porter days by hand in the schedule screen).
- On cleaning-days change, if `!dpDaysCustomized`, re-seed the porter days from the new cleaning days; otherwise leave them.

## Out of scope (separate follow-ups, noted)

- **F** — service-switch leaves stale cross-flow state. Real, but not specific to the labeling; do it as its own change (reset service-specific fields on switch, keep identity).
- **Window-chip copy** — the cleaning "when" chips are currently `Mornings / Afternoons / Evenings / Anytime`. Whether to reframe as an access window (`After hours / Overnight / Daytime / Flexible`) is a **content decision** — defaulting to **keep current** unless Alex wants the change in this pass.

## Files touched

- `css/quote-noir.css` — `.qf-svc-cue` badge + `--accent-porter` token + the green/blue variants (base + mobile + desktop). Cache-bump.
- `quote.html` — static service-cue markup on `size` / `days` screens; cache-bumps.
- `js/quote-flow.js` — render the cue per screen/service (the `schedule` cue is JS-rendered with the porter card); the Combined "1 of 2 / 2 of 2" sub-label; the **E** sync (`dpDaysCustomized` + re-seed in `dpToggleDay`/`dpApplyPreset` for cleaning days). Cache-bump.

## Testing

- Preview drive of all three flows at mobile + desktop: cues present, correct color/copy, no layout break.
- **E** repro: Combined → set cleaning days → don't touch porter → edit cleaning days → porter days follow; then customize porter days → edit cleaning days → porter days stay.
- e2e suite green (janitorial + dayporter + both + keyboard + a11y).

## Rollout

Branch `combined-flow-redesign` → verify in preview + e2e + `/ays` → merge ff to `main` → verify live (cache-busters).
