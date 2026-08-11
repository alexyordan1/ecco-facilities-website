# Quote Wizard Welcome — Situation-First Redesign (Design Spec)

**Date:** 2026-08-10
**Status:** Approved direction (brainstormed with Alex); pending spec review
**Scope:** Screen 1 (`#qfScreen_welcome`) of the quote wizard only

## Problem

Prospects arrive at the quote wizard not knowing Ecco's service terms. The current
welcome screen asks "What brings you to Ecco?" and offers three cards headlined by
the *terms* (Commercial Cleaning / Day Porter / Combined), with the situation as
fine print. Someone who doesn't know what a "Day Porter" is must read all three
sub-lines and do the mapping themselves — and "Combined" only means something once
the other two terms are understood.

What prospects actually say (per Alex): **"someone to clean"** and **"support
during the day."**

## Decision

Flip the hierarchy. Ask **"Which best describes what you're looking for?"** and
offer **two situation descriptions** as the cards' headlines. The technical term
becomes a small tag inside each card. The Combined path becomes a discreet
"Need both?" link below the cards. Content is **centered** on the stage like the
other screens (today the welcome content is anchored bottom-left on desktop).

The service mapping (`data-service` = `janitorial` / `dayporter` / `both`) and the
downstream flow are unchanged. This is a presentation-layer change on screen 1.

## Final copy (English, exact)

**Prompt title (H2):**

> Which best describes what you&rsquo;re <em>looking for</em>?

The current sub-line ("Pick what kind of care you're looking for.") is **removed**
— the question is self-sufficient.

**Card 1** — `data-service="janitorial"`, `data-service-label="Commercial Cleaning"`, keeps the building icon:

- Headline (`.qf2-card-label`): `A cleaning crew that comes in after hours`
- Detail (`.qf2-card-includes`): `Trash, floors, restrooms, desks — the space is ready before anyone walks in.`
- Term tag (new `.qf2-card-tag`): `Commercial Cleaning`
- `aria-label`: `A cleaning crew that comes in after hours — Commercial Cleaning: trash, floors, restrooms and desks, ready before anyone walks in`

**Card 2** — `data-service="dayporter"`, `data-service-label="Day Porter"`, keeps the person icon:

- Headline: `Someone on site during business hours`
- Detail: `Restrooms checked, spills handled, supplies stocked.`
- Term tag: `Day Porter`
- `aria-label`: `Someone on site during business hours — Day Porter: restrooms checked, spills handled, supplies stocked`

**"Need both?" link** — a `<button type="button">` styled as a quiet text link,
placed below the two cards, no card chrome, no icon:

```html
<button type="button" class="qf2-both-link" data-service="both"
        data-service-label="Combined"
        aria-label="Need both? Combined: Commercial Cleaning plus Day Porter from one team">
  Need both? One team can cover day and night <span aria-hidden="true">&rarr;</span>
</button>
```

Copy notes:
- Em dashes in markup use HTML entities (`&mdash;`), matching the wizard convention
  (commit a890c8e).
- Naming-gloss rule: both service names appear on this screen (as tags); each card's
  headline + detail **is** the gloss. The link's visible copy says "day and night"
  rather than naming both services a second time.
- No unverified claims introduced. The trust strip below stays exactly as-is.

## Layout

**Mobile (base, unchanged mechanics):** stacked cards, "Need both?" link below them,
then the trust strip. The link must meet the 44px touch-target minimum
(`display:inline-flex; min-height:44px`).

**Desktop (≥880px) — the centering change.** Replace the current bottom-left block
(`.qf-stage:has(.qf-screen.is-welcome.is-active)` with `align-items:flex-start;
justify-content:flex-end`, quote-noir.css:583) with the same pattern the space
screen uses (quote-noir.css:704):

- Stage: `align-items:center; justify-content:center;
  padding:clamp(2.5rem,6vh,4.5rem) clamp(40px,6vw,90px)`
- Screen: `max-width:920px; margin:0 auto; width:100%`
- Title: `font-size:clamp(2.4rem,4vw,3.4rem)` (the new question is longer than
  "What brings you to Ecco?"; the current 4.6rem clamp would wrap poorly)

**Background:** drop the desktop-only dusk-skyline override with its bottom-weighted
scrim (it exists to serve the bottom-left layout). The base welcome photo
(`welcome-team-conference.webp`, quote-noir.css:461) then applies at all viewports;
rebalance its veil toward an even, space-screen-like weighting so centered text is
readable. Final scrim values tuned visually via screenshots on both viewports.

**Grid:** `.qf2-grid-3` keeps its name and row layout on desktop; with two cards,
cap the row (e.g. `max-width:760px`) and center it so cards don't balloon. Center
the "Need both?" link under the row.

## JS changes (minimal)

1. **None for routing.** The delegated welcome handler binds every `[data-service]`
   element on the screen (quote-flow.js:1299), so the new link routes to the
   Combined flow automatically, including the resume-banner and service-switch
   cleanup paths.
2. **One selector extension** for keyboard access: the 1–9 position-pick handler
   (quote-flow.js:5513) queries `.qf2-grid-3 .qf2-card[data-service]`; add
   `.qf2-both-link[data-service]` so key 3 reaches the link. Document order keeps
   cards at 1–2, link at 3.

## Files touched

| File | Change |
|---|---|
| `quote.html` | Rebuild `#qfScreen_welcome` body: new title, drop sub, 2 rebuilt cards + tag element, add `.qf2-both-link`; bump `quote-noir.css?v=63 → v64` and the `quote-flow.js` cache buster |
| `css/quote-noir.css` | New `.qf2-card-tag` + `.qf2-both-link` styles (base + mobile + desktop); replace welcome desktop stage block with centered pattern; grid cap for 2 cards; remove/rebalance welcome background overrides |
| `js/quote-flow.js` | One-line keyboard selector extension |
| `tests/e2e/*.spec.js` | Update `.qf2-card[data-service="both"]` selectors (both-flow.spec.js ×5) to `[data-service="both"]`; update welcome copy/label expectations in welcome-and-resume, keyboard-and-a11y, a11y-audit, error-states, janitorial-flow, dayporter-flow |

## Out of scope

- Dead "Not sure?" mini-quiz JS (quote-flow.js:1369–1433) — separate cleanup task.
- Any change to later screens, the rail labels, review screen, or submit payload.
- The trust strip.

## Verification

1. Full e2e suite green (40 tests; serve on :8081 if :8080 is taken).
2. Screenshots at mobile and desktop viewports: centered layout, 2 cards + link,
   readable title over the rebalanced scrim, no eclipse/overlap of the trust strip.
3. Keyboard pass: keys 1/2/3 select janitorial/dayporter/both; Enter/Esc unchanged.
4. After deploy: verify on the live `.pages.dev` URL (curl -L for extensionless),
   then ask Alex to hard-refresh on a real iPhone.
