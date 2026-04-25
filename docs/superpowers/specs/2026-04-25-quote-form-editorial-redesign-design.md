# Quote form — editorial redesign · design spec

**Date:** 2026-04-25
**Author:** Alex (with Claude as collaborator)
**Status:** Approved for implementation
**Source:** brainstorming session iterating in `.superpowers/brainstorm/16061-1777145683/`

## 1. Context & motivation

The current production quote form (`https://eccofacilities.com/quote.html`) ships the V2 conversational design. After live QA we identified five polish opportunities that, taken together, push the form from "working" to "premium editorial":

- Alina messages above each title repeat what the H2 already says ("What are we caring for?" + "What kind of space?" reads as filler)
- Title bubbles compete visually with the rail above and the cards below
- Warm cream + peach edges feel less sophisticated than the editorial mockup palette
- Card SVG icons are uniform — every category looks interchangeable
- Form lacks the distinctive image-led identity competitors (Typeform, Tally, Lemonade) lean on

Goal: re-skin the form using a single pilot screen (Step 2 SPACE), validate, then propagate the same patterns to the other 7 screens. **No flow / state / submission changes.** Pure presentation layer.

## 2. The five decisions

### D1 · Title presentation — Editorial flat (no bubble)

The H2 + subtitle no longer sit inside a white rounded card. They float directly on the cream background, centered. Removes a visual frame that was competing with the Alina pill above and the card grid below.

**Implementation hint** (the plan will pin exact selectors): the current production wraps the title block in a white-card container styled by `.qf2-prompt` (or equivalent) inside each `.qf-screen .qf2-body`. We strip that container's background, border, padding-as-card, and shadow — keeping the inner `<h2 class="qf2-prompt-title">` and its sibling `<p>` intact. Same approach across all 8 screens.

### D2 · Palette — Cool sage cream, sage-tinted edges, Fraunces stays

Switch the V2 token block from warm-peach surface to sage-tinted cool surface. Keep the existing Fraunces serif (avoids font-swap risk and matches the rest of the eccofacilities.com site).

| Token | Current value | New value |
|---|---|---|
| `--qf2-cream` | `#FDF8F3` (warm) | `#EEF2ED` (sage tint) |
| `--qf2-cream-2` | `#FBF4EC` | `#F6F9F5` |
| `--qf2-peach` | `#F5E6D3` | `#DFE7E0` |
| `--qf2-peach-deep` | `#EDD4B2` | `#C4D4C5` |
| `--qf2-edge-warm` | `rgba(237,212,178,.5)` | `rgba(45,122,50,.16)` (sage 16%) |
| `--qf2-ink` | `#2C3E50` (slate) | `#0B1D38` (navy) |
| `--qf2-muted` | `#8B95A5` | `#6B7A8D` (cooler) |
| `--qf2-fd` | `'Fraunces'` | unchanged |
| `--qf2-fb` | `'DM Sans'` | unchanged |
| `--qf2-fh` | `'Caveat'` | unchanged |
| `--qf2-sage` | `#2D7A32` | unchanged |
| `--qf2-sage-bright` | `#3D9A43` | unchanged |
| `--qf2-sage-soft` | `#E3EDE4` | unchanged |

Token changes ripple through every component that uses `var(--qf2-*)`. Already-deployed CSS-var scoping fix (commit `136bcc0`) ensures the new values reach body-attached elements (exit modal, toasts) too.

### D3 · Font — Fraunces (no change)

Considered Cormorant Garamond, EB Garamond, Playfair Display, DM Serif Display, Italiana. Fraunces wins because:

- Already shipped on the wider eccofacilities.com site → consistency
- Variable font (single file, all weights) → bandwidth-friendly
- Italic-emphasis pattern (`<em>` inside H2) reads cleaner in Fraunces than in Playfair/Cormorant at this size

No file change required for fonts.

### D4 · Alina copy — useful contextual rewrites

Six Alina-pill messages are reworded. The Size H2 + subtitle are also tightened. Pantallas 1 (Welcome) and 8 (Success) keep their current copy.

| # | Screen | Old Alina | New Alina | H2 change |
|---|---|---|---|---|
| 1 | Welcome | "Hi there — let's start here →" | unchanged | none |
| 2 | Space | "What are we caring for?" | "The type tells me how to staff this" | none |
| 3 | Info | "Now the friendly part →" | "So I can email your quote — no spam, promise" | none |
| 4 | Size | "How much space?" | "Pick a range — exact sq ft optional" | "How much space are we cleaning?" → "How big is the space?" |
| 5 | Schedule | "When works best?" | "Days + a time window — flexible later" | none |
| 6 | Location | "One last thing →" | "Where we're meeting — for the site visit" | none |
| 7 | Review | "One last look →" | "One scan and we're done →" | none |
| 8 | Success | "Got it — talk soon ~" | unchanged | none |

Size subtitle also simplifies: "Pick the closest range, or tell me exactly if you know it." → "Pick the closest range — or type the exact number."

### D5 · Card identity — Photo micro · duotone sage (G2)

The current `.qf2-card-ico` block (peach circle wrapping an inline SVG) is **replaced entirely** by a `.card .photo` block — no SVG fallback, no overlay. The icon disappears; the photo takes its slot. Apply a CSS-only duotone sage filter so all photos share the same brand tone regardless of source:

```css
.card .photo {
  width: 52px; height: 52px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(45,122,50,.18), 0 6px 12px -4px rgba(11,29,56,.14);
  filter: grayscale(1) sepia(.2) hue-rotate(70deg) saturate(1.2) brightness(.95);
}
```

Applies only to two screens with non-numeric, photographable categories:

- **Welcome** (3 service cards): Janitorial, Day Porter, Combined
- **Space** (6 space cards): Office, Medical, Retail, Restaurant, Fitness, Something else

The "Something else" card uses a `linear-gradient(135deg, #E8C4A0 0%, #D4A374 50%, #5C4A87 100%)` instead of a photo (no specific category to depict) and has `filter: none`.

Size cards (Under 3K, 3-6K, etc.) **do not get photos** — square footage is not visually meaningful as an image. They keep their existing typographic treatment.

Day chips (Mon, Tue, etc.) and time chips (Morning, Afternoon, etc.) **do not get photos** — too small, no visual benefit.

## 3. Per-screen change matrix

| # | Screen | Bubble removal | Palette | Alina copy | Photo cards |
|---|---|---|---|---|---|
| 1 | Welcome | ✓ | ✓ | unchanged | ✓ (3 services) |
| 2 | Space | ✓ | ✓ | new | ✓ (6 spaces) |
| 3 | Info | ✓ | ✓ | new | n/a |
| 4 | Size | ✓ | ✓ | new + H2 + sub | n/a |
| 5 | Schedule | ✓ | ✓ | new | n/a |
| 6 | Location | ✓ | ✓ | new | n/a |
| 7 | Review | ✓ | ✓ | new | n/a |
| 8 | Success | n/a (no title bubble currently) | ✓ | unchanged | n/a |

## 4. Files affected

- **`css/quote-flow.source.css`** — token block update (D2), bubble-removal rules (D1), photo-card CSS (D5)
- **`css/quote-flow.css`** — minified output of the above
- **`quote.html`** — Alina + H2 + subtitle text changes (D4), card markup updates to swap SVG icon → photo div (D5), removal of `.qf2-prompt` bubble wrapper around titles (D1)
- **`quote.html`** cache busters bumped: `quote-flow.css?v=` and `quote-flow.js?v=` (no JS change needed but bumping CSS only is enough)
- **`images/spaces/`** new directory — 8 photos (3 services + 5 spaces; "Something else" uses a CSS gradient, not a photo) at 320×320, optimized webp + jpg fallback. Source list and licensing covered in plan.

## 5. Asset specification (photos)

Each photo:

- **Resolution:** 320×320 px (displayed at 52×52, 6× density buffer for retina)
- **Format:** Primary `webp` (q=80), fallback `jpg` (q=85)
- **Crop:** Square, focal subject centered, slight depth-of-field on background
- **Color:** Source can be color or B&W — duotone CSS filter normalizes them
- **Licensing:** Stock (Unsplash free / Pexels) or original. No watermarks. Attribution captured in `images/spaces/CREDITS.md`.

Subjects:

| Slot | Subject |
|---|---|
| `service-janitorial.jpg` | Cleaning supplies, mop bucket, or cleaner mid-task in commercial space |
| `service-dayporter.jpg` | Uniformed staff helping/greeting in lobby or office hallway |
| `service-combined.jpg` | Wider view of staff working in business setting |
| `space-office.jpg` | Modern open-plan office, daylight |
| `space-medical.jpg` | Clinic interior, exam room or waiting area |
| `space-retail.jpg` | Storefront interior or retail floor |
| `space-restaurant.jpg` | Café or restaurant dining area |
| `space-fitness.jpg` | Gym, yoga studio, or fitness floor |
| (Something else uses gradient — no photo) | — |

## 6. Out of scope

Explicitly NOT changing in this spec:

- **Day Porter flow** (incomplete per existing instructions — separate sprint)
- **Form state, validation, submission logic** (presentation only)
- **Edit-in-place panels** in Review step (keep current behavior + style)
- **Cloudflare Turnstile widget** (already fixed in commit `136bcc0`)
- **Mobile breakpoints** beyond what falls out of CSS token swaps (mobile QA happens in implementation phase)
- **Success page timeline / reference ID** (already polished)
- **Resume banner** (already polished)
- **Exit-intent modal** (already polished + fixed)
- **Cookie banner** (separate component, no changes)

## 7. Test plan

After implementation:

- Visual: side-by-side screenshot of each of the 8 screens, before vs after
- Console: zero warnings on production (no broken `var()` references)
- Cross-OS: verify duotone filter renders consistently on Safari, Chrome, Firefox
- Mobile: visual check on 375×812 viewport for each screen
- a11y: alt text on every photo card, color contrast still WCAG AA on the new sage cream
- Performance: image bytes per screen — target combined photos ≤ 80 KB

## 8. Open questions / risks

- **Photo curation timing.** Implementation can ship with placeholder Unsplash URLs in dev, but production deploy is gated on the 9 final assets being in `images/spaces/`. This is a content task, not an engineering task.
- **Day Porter flow incompleteness.** D5 treats Day Porter card the same as the others, but the downstream Day Porter quiz steps remain unchanged. Visual mismatch between welcome card and the DP flow may surface — flag for the next sprint.
- **Editorial palette drift.** Switching `--qf2-cream-2` and `--qf2-peach-deep` may affect components I haven't audited (e.g., the Alina chat bubble fill, Edit-panel surfaces). Implementation must visually scan every screen at desktop AND mobile after the token swap.
- **CSS filter fallback.** Older Safari (<=14) may render the duotone filter differently. Acceptable degrade: photo shows in muted grayscale if hue-rotate is unsupported. Worth a quick BrowserStack pass before final deploy.
