# Quote Wizard — Educational Notes — Design

**Date:** 2026-06-26 · **Status:** approved (pending spec review)

## Goal

Make the quote wizard *educate*, not just collect. Each key step gets a subtle
note explaining what it means and why — especially the cleaning-vs-porter
mental model that confused Alex himself in the Combined flow:

- **Cleaning** (Size, Days): the customer gives **days + access windows**;
  *Ecco* sets the crew size, hours per visit, and price from the space.
- **Porter** (Schedule): the customer gives **the hours**; a porter stays
  on-site through that window.

In the Combined flow the contrast emerges naturally from two **static** notes
("we set the hours" on cleaning → "you choose the hours" on porter) — no
flow-conditional JS (we just removed the cue system that did that).

## Treatment (chosen)

Short subtitle + a subtle one-line **note** (ℹ icon + tenue text) below it.
Educates visibly without a heavy callout box — respects Noir minimalism.

## Scope

Notes on **4 screens**: Space, Size, Days, Schedule. Plus a small **hint**
under the Days "When are we welcome?" time-window label. Welcome, Location,
Info, Review, Success are already clear — untouched.

## Copy (desktop / mobile)

| Screen | Subtitle (kept short) | Note ℹ (new) |
|---|---|---|
| **Space** `qfScreen_space` | "Pick the closest match. We'll tailor the plan." *(keep)* | D: "Each space type cleans differently — we match the methods and certified products to yours." · M: "We match the plan to your space type." |
| **Size** `qfScreen_size` | "Pick the closest range, or type the exact number." *(keep)* | D: "Your square footage sets the crew, the hours per visit, and the price — so it fits the space." · M: "Sets your crew, hours, and price." |
| **Days** `qfScreen_days` | D: "Pick the days and the windows we're welcome in." · M: "Pick days + access windows." *(was D "Pick the days and times that fit. We can adjust later." / M "Days + windows. We can adjust later.")* | D: "You pick the days; we set the crew and hours per visit from your space. Adjust anytime." · M: "We set the crew and hours from your space." |
| **Schedule** `qfScreen_schedule` | "Add the porters you need and set each one's hours." *(single `<p class="qf-dp-prompt-promise">`, no D/M split; was "Add the porters you need and configure their hours.")* | D: "You set the hours here — a porter stays on-site through the window you choose." · M: "You set the hours; a porter covers that window." |

**Days time-window hint** — under the "When are we welcome?" sub-label:
D: "Your access window — not the length of the visit." · M: "Access window, not visit length."

Voice: warm, active, contractions, sentence case, no "simply/just". Matches the
wizard's existing first-person tone ("Tell me about your business").

## Component — `.qf-edu-note`

A centered, low-contrast note line under the subtitle. Reuses the existing
`.qf2-prompt-sub-desktop` / `.qf2-prompt-sub-mobile` responsive-copy pattern for
the D/M variants. The ℹ icon is an inline stroke SVG (currentColor) — no emoji
(the wizard is emoji-free after the cue removal).

```css
/* Educational note — sits under the prompt subtitle to teach what a step means
   and why (e.g. "we set the crew + hours from your space"). Static; the Combined
   cleaning-vs-porter contrast emerges from the two notes, no JS. 2026-06-26. */
.qf-edu-note{ display:block; max-width:33rem; margin:.15rem auto .4rem; font-size:.8rem; font-weight:300; line-height:1.5; color:var(--ink-dim); text-align:center; text-shadow:0 1px 10px rgba(0,0,0,.5); }
.qf-edu-note svg{ width:14px; height:14px; vertical-align:-2px; margin-right:5px; opacity:.7; stroke:currentColor; fill:none; }
/* hint variant — even quieter, no icon (used under the "When are we welcome?" label) */
.qf-edu-hint{ display:block; margin:.2rem auto 0; font-size:.72rem; font-weight:300; line-height:1.45; color:var(--ink-dim); text-align:center; opacity:.85; text-shadow:0 1px 8px rgba(0,0,0,.5); }
@media (max-width:879px){ .qf-edu-note{ font-size:.76rem; max-width:92%; } .qf-edu-hint{ font-size:.7rem; } }
@media (min-width:880px){ .qf-edu-note{ font-size:.82rem; } }
```

Icon markup (inline, reused per note):
```html
<svg viewBox="0 0 24 24" aria-hidden="true" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
```

Note markup pattern (placed as the last child of `.qf2-prompt`, after the subtitle):
```html
<p class="qf-edu-note"><svg …>…</svg><span class="qf2-prompt-sub-desktop">DESKTOP COPY</span><span class="qf2-prompt-sub-mobile">MOBILE COPY</span></p>
```

## Placement

- Space/Size/Days: append the `.qf-edu-note` `<p>` inside `.qf2-prompt`, after the
  existing `.qf2-prompt-sub` paragraph.
- Schedule: the prompt has no `.qf2-prompt-sub`; the existing
  `<p class="qf-dp-prompt-promise">` becomes the subtitle (reworded), and the
  `.qf-edu-note` goes right after it.
- Days hint: append a `.qf-edu-hint` `<span>`/`<p>` right after the
  "When are we welcome?" label spans (line ~661).

## Footprint

- `quote.html` — 4 notes + 1 hint + 2 reworded subtitles (Days, Schedule).
- `css/quote-noir.css` — the `.qf-edu-note` / `.qf-edu-hint` component.
- Cache-buster: `quote-noir.css?v=60 → 61` (quote.html). **No JS**, **no noir.css**.

## Accessibility

- ℹ icon `aria-hidden="true"` (decorative; the text carries meaning).
- Note is a `<p>` after the subtitle → natural reading order, no heading-level
  impact (h2 title stays first).
- Color contrast: `--ink-dim` over the photo scrim + text-shadow; verify ≥4.5:1
  during implementation (AYS Phase 7).

## Testing

- e2e: existing 41 must stay green (copy/markup change, no logic). No new test
  needed (no behavior change); optionally assert a note exists on Days.
- Visual: preview each of the 4 screens at 390px + 1280px, both Combined and the
  relevant standalone flow; confirm the note reads, wraps cleanly, and the
  cleaning→porter contrast is legible in Combined.

## Out of scope

Flow-conditional copy (no JS toggles). Reworking the time-window options
themselves. Any non-wizard page.
