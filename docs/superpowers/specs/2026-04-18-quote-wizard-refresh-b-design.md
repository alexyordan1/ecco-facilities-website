# Quote Wizard Refresh (Option B) — Design Spec

**Date:** 2026-04-18
**Scope:** Visual refresh of `/quote.html` addressing 6 identified UX problems without rewriting IA, backend, or the Alina persona system.
**Estimated effort:** ~1 day (implementation + QA + AYS + deploy)

---

## Problem Statement

The quote wizard has been iterated multiple times and reached a working state ("feat(quote): modernización visual + perf + dark mode"). However, a review of the live flow exposed six concrete UX problems that weaken the funnel:

1. **Step 2 ("You") has a large empty vertical gap** above the form. The `.qf-screen.step-2` rule sets `padding-top: 108px` to clear the sticky rail, but at desktop viewport this creates visible dead space between the rail and the question.
2. **Progress indication is visually weak.** `.qf-flow-rail` stations with fill track work but feel thin; "Step X of 7" indicator sits in a low-attention corner. Users cannot see at a glance how far they are.
3. **Choice cards feel dated on mobile.** Equal-height full-width rows with a floating `(i)` icon top-right and a cramped "Most popular" badge on the first card. Tap targets are small, visual weight is uneven.
4. **The form step loses Alina's voice.** Steps 1 and 3+ have conversational bubbles; step 2 ("Tell me a little about you") has only a tiny avatar bubble and stacked inputs — feels like a generic form, not a continuation of the conversation.
5. **No between-step value reinforcement.** The user has no visible signal of why each question matters or what they get from completing it. Trust strip only appears on step 1.
6. **CTA hierarchy is flat.** Click-to-advance on cards works, but there is no persistent "Continue" button that signals forward motion, and its absence creates uncertainty when the user expects to confirm a choice before moving on.

## Goals

- Resolve all six problems with reusable components that fit the existing `qf-*` namespace and token system.
- Preserve the Alina persona (avatar, name, bubbles, typing indicator).
- Preserve the 7-step IA (Service → You → Space → Location → Size → Schedule → Review).
- Preserve the existing palette, typography, dark mode, and accessibility baseline.
- Ship without regressing: iOS Safari zoom, dark mode, backdrop-filter fallbacks, ≥44px touch targets, WCAG 2.1 AA contrast.

## Non-Goals

- No backend or state-model changes.
- No change to `css/styles.css` (file is empty; unrelated to wizard).
- No new third-party dependencies (vanilla HTML/CSS/JS per project rules).
- No rethink of the flow pattern (that is option C, out of scope).
- No changes to other pages.

---

## Design Decisions

### D1 — Progress Indicator: Sticky-top rail + thin fill bar (desktop) / Pill + bar (mobile)

The existing `.qf-flow-rail` stays as the primary indicator on desktop but gains:
- A 2px linear fill bar pinned to the very top edge of the rail (above station dots), animated to the current-step percentage, using `--qf-sage-bright`.
- Tighter vertical padding so the rail occupies less height, reducing the `padding-top` pressure on step content.
- `.qf-screen.step-2 { padding-top: 108px }` reduces to match step 1 (`48px`) now that the rail is visually lighter, closing the empty gap.

On mobile (≤640px), the full rail collapses to a compact pill:
```
┌─────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━░░░░░░░░ │  ← 2px fill bar (full width)
│          Step 3 of 7         │  ← small caption
└─────────────────────────────┘
```
Station labels hide below 640px. The pill stays sticky-top under the nav.

*Rationale:* Keeps existing rail investment (labels, values, dark mode, backdrop-filter) while fixing the "weak signal" problem via the fill bar and closing the spacing problem by making the rail visually tighter.

### D2 — Choice Cards: 2-col grid (desktop) / Full-width rows with improved anatomy (mobile)

**Desktop (≥960px):**
- 4-up grid becomes 2-col when 4 choices, 2-col when ≤4 — never cramped.
- Card height grows from ~170px to ~210px.
- Icon moves from center-top to corner (top-left, 40px).
- Label + hint left-aligned below icon.
- "Most popular" badge becomes a chip in the top-right corner, not overlapping the icon.
- `(i)` info becomes a small text link "¿Qué incluye?" in the card footer instead of a floating circle.
- Hover: lifts 2px + sage-tint border.
- Selected: sage-bright border + inner sage-tint background + checkmark icon in top-right (replaces the popular chip if present).

**Mobile (≤640px):**
- Cards stay full-width rows but grow to min-height 88px.
- Icon on the left (48px), label + hint on the right, chevron `›` on far right to suggest tappability.
- "Most popular" chip becomes a small pill above the title, inline with the label.
- Tap target is the full card. Active state flashes sage-tint.

### D3 — Form Step ("You") Layout: 2-col with Alina bubble on desktop, stacked with bubble on mobile

Step 2 currently: centered form, tiny avatar bubble, wasted vertical space.

New layout (desktop, ≥960px):
```
┌─────────────────────────────────────────────────────┐
│ [rail stays at top]                                 │
│                                                      │
│  ┌─────────────┐   ┌──────────────────────────────┐ │
│  │             │   │  Tell me a little about you  │ │
│  │  [Avatar]   │   │  ─────────────────────────── │ │
│  │             │   │  [First name] [Last name]    │ │
│  │ Before we   │   │  [your@email.com]            │ │
│  │ dive in,    │   │  [Phone (optional)]          │ │
│  │ let me get  │   │                              │ │
│  │ to know you │   │  [ Continue → ]              │ │
│  │ a little... │   │                              │ │
│  └─────────────┘   └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```
- Left column: sticky avatar + bubble quote. Width ~320px.
- Right column: form fields + CTA. Flex-grows to fill.
- Inputs: iconic prefix (user/mail/phone glyphs) integrated into border-left as a 40px zone, not stacked vertically with icons as rows.

Mobile (≤640px):
- Stack: bubble on top (compact, avatar inline), form fields below, CTA sticky at bottom of viewport.

### D4 — Alina Voice in Every Step

Every step gets a `.qf-bubble` with context-aware copy. This already exists structurally in step 1; we extend it to all steps:

| Step | Alina opener |
|------|------|
| 2 · You | "Antes de continuar, déjame conocerte un poco." |
| 3 · Space | "¿Dónde vamos a cuidar de tu espacio?" |
| 4 · Location | "¿En qué dirección está el lugar?" |
| 5 · Size | "Más o menos, ¿qué tamaño tiene?" |
| 6 · Schedule | "¿Cuándo te gustaría que empecemos?" |
| 7 · Review | "Aquí está tu plan — revísalo y lo ajusto si hace falta." |

Copy is stored as `data-alina-intro` attributes on `.qf-screen` nodes and rendered by `quote-flow.js` on step enter, reusing the existing `.qf-typing-dots` animation for a 600ms typing feel.

### D5 — Value Reinforcement Strip

Below each step's primary content, a slim "why we ask" note:

| Step | Value note |
|------|------|
| 2 · You | "Para personalizar la propuesta a tu nombre." |
| 3 · Space | "Para sugerir los productos y frecuencia correctos." |
| 4 · Location | "Para calcular tiempos de equipo y rutas." |
| 5 · Size | "Para estimar horas-hombre precisas." |
| 6 · Schedule | "Para coordinar disponibilidad real del equipo." |

Rendered as a `.qf-value-note` pill (sage-tint background, 12px padding, 0.8rem text) below the form or choice grid. Stored as `data-value-note` on screens.

Trust strip ("Secure & private · X min left · No commitment") appears at the bottom of every step, not just step 1.

### D6 — CTA "Continue": Always visible, disabled → active

A new persistent `.qf-continue-cta` sits in each `.qf-screen` as the forward action.

- **States:**
  - `disabled` — grey background, cursor not-allowed, text "Elige una opción" or "Completa los datos"
  - `active` — `--qf-sage` fill, white text, right chevron icon
  - `loading` — spinner, dim text "Procesando..."
- **Desktop:** right-aligned below content, 160px min width.
- **Mobile:** sticky to the bottom edge of viewport, full-width with 16px side padding, safe-area-inset-bottom respected.
- Click-to-advance on choice cards still works — the CTA is redundant confirmation, not required action, but it becomes the only way forward on form steps (2, 4, 7).

Component classes: `.qf-continue-cta`, `.qf-continue-cta[disabled]`, `.qf-continue-cta.is-loading`.

---

## Component Inventory

New or refactored components, all in the `qf-` namespace:

| Component | Purpose | Status |
|------|------|------|
| `.qf-rail-fill-bar` | 2px linear progress on top of rail | **new** |
| `.qf-rail-pill` | Compact mobile progress | **new** |
| `.qf-service-card` (v2) | Rebuilt choice card | **refactor** |
| `.qf-form-stage` | 2-col form layout | **new** |
| `.qf-bubble` | Alina intro bubble on every step | **extend** |
| `.qf-value-note` | "Why we ask" pill | **new** |
| `.qf-continue-cta` | Persistent continue button | **new** |

## Files Touched

| File | Change | Approximate delta |
|------|------|------|
| `css/quote-flow.css` | Component additions + rail tightening | +250 / -120 lines |
| `js/quote-flow.js` | Bubble rendering per step, CTA state machine | +180 / -40 lines |
| `quote.html` | Markup for form layout, value notes, CTA, bubble slots | +120 / -90 lines |
| Cache busters | `v=4.2` → `v=5.0` in quote.html | 3 refs |

Zero changes to `css/styles.css`, backend, other pages, or chat widget.

---

## Accessibility

- Rail fill bar: `role="progressbar"` with `aria-valuenow` / `aria-valuemax` set by `quote-flow.js`.
- Choice cards: `role="radio"` inside `role="radiogroup"`, keyboard arrow-key navigation.
- Continue CTA: `aria-disabled` synced with visual state; screen reader announces reason when disabled.
- Alina bubbles: `aria-live="polite"` on the typing dots wrapper so the intro is announced after the dot animation completes.
- Focus rings preserved (`:focus-visible { outline: 2px solid var(--qf-sage-bright) }`).
- Touch targets ≥44px verified with Playwright at mobile viewport.

## Dark Mode

Every new component includes a `@media (prefers-color-scheme: dark)` block using the existing token system (`--qf-ink`, `--qf-sage-bright`, etc.). Rail fill bar uses `--qf-sage-bright` in dark mode for better contrast against the ink background.

## iOS Safari Safeguards

- Input `font-size: 1rem` (16px) on all text inputs to prevent zoom-on-focus.
- `meta viewport` keeps `maximum-scale=1.0` (already present).
- CTA sticky-bottom respects `env(safe-area-inset-bottom)`.

---

## Testing Plan

1. Playwright capture of 7 steps × 2 viewports after each implementation milestone, diffed against current screenshots.
2. Manual dark-mode pass (toggle `prefers-color-scheme: dark` in preview).
3. Manual iOS Safari pass on real device after deploy (user verifies).
4. AYS audit before commit (scores ≥90 required).
5. Post-deploy: hard-refresh on `.pages.dev` URL, verify cache busters propagated.

## Rollout

- All edits on main feature branch, single commit once AYS passes.
- Backup files must be created before edits begin: `quote.backup.html`, `css/quote-flow.backup.css`, `js/quote-flow.backup.js`. (Verified 2026-04-18: no existing backups in the workspace — memory referring to `quote-conv.backup.js` is stale.)
- Cache busters bumped to `v=5.0` in the same commit.
- Deploy to Cloudflare Pages (auto from GitHub push).
- Verify on `eccofacilities.com` and `.pages.dev` URL after deploy.

## Open Risks

- Rail fill bar + station-label rendering at ≤960px / >640px (tablet) needs a dedicated breakpoint pass.
- `.qf-screen.step-2` padding change must be retested for all 7 steps, not just step 2.
- CTA sticky-bottom on iOS Safari + the floating chat widget on bottom-right — verify no overlap. If conflict, CTA gets `right: 72px` on mobile to clear the chat FAB.

## Success Criteria

- All six problems from the brief resolved, verified by before/after screenshot diffs.
- AYS score ≥90 on the remediated wizard.
- No regression on other pages (other pages do not import quote-flow CSS/JS — isolated).
- Cache busters updated, `.pages.dev` deploy verifies visually.
