# Product

## Register

product

## Users

**Primary:** Facility Managers at mid-market commercial properties (offices, medical clinics, retail stores, schools, restaurants, fitness studios) in NYC + 5 boroughs. They're vendor-shopping under time pressure — comparing 3 quotes in 20 minutes between meetings.

**Secondary:** Small-business owner-operators (single restaurant, boutique, clinic) who don't speak facilities-industry jargon but need recurring cleaning. They hand-write their schedule on a whiteboard, not in software.

**Tertiary:** Property managers of multi-tenant buildings looking for one vendor across portfolios.

**Context when using:** Mostly desktop at office during business hours, sometimes mobile in transit between sites. Mid-attention — not a leisure browse, but not on-the-clock urgent either. They've already typed "commercial cleaning NYC" into Google and clicked through to compare. Their bar isn't "wow me" — it's "earn my 5 minutes by not wasting them."

## Product Purpose

eccofacilities.com is a **commercial cleaning + day-porter service company**. The site's job is twofold:

1. **Quote form (`/quote`)** — convert qualified leads. Users describe their space + schedule, the form captures contact info early and serves a precise quote-able summary to the sales team. Lead-quality matters more than form-completion-rate; bad data wastes sales calls.
2. **Marketing surface (`/`, `/services`, etc.)** — establish trust, answer "are these the right people?", route users to the quote form.

Success = a Facility Manager saying "this feels run by adults" within 30 seconds, then giving us their honest space details without bouncing at the schedule step.

## Brand Personality

**Three words:** Editorial · Warm · Adult.

- **Editorial** — italic-serif accents, magazine-like headlines, Caveat script for transitions ("Not sure? I can help you pick"), hand-curated feel. The form reads like a postcard, not a SaaS funnel.
- **Warm** — Alina (the persistent helper persona with a real headshot, not a chatbot avatar) frames every step. Copy is conversational ("Let's get acquainted.", "Here's your snapshot.") without being twee.
- **Adult** — no over-promising microcopy, no urgency timers, no fake scarcity. The voice respects that the user is busy and competent. We avoid dramatic transitions, gradient text, and "we'll change your life" energy.

**Voice rules:**
- Use sentence case in copy, not Title Case. Title Case feels corporate.
- Italic-serif accents on key nouns ("how big is the *space*?"). Reserved for the H2.
- Caveat script (a sage handwritten font) for transitional helpers ("Talk soon~", "I'll pass that to our crew~"). Never for primary actions.
- No em-dashes. Use periods or commas.

## Anti-references

What this is NOT, with concrete callouts:

- **Not Servpro / Stratus / ABM corporate sites** — generic blue-and-white stock-photo cleaning industry. The trap: "facilities cleaning → green and clean and bubbles." We do NOT use category-reflex green + spray bottles + smiling-employee stock photos.
- **Not a SaaS landing page** — no hero with gradient text, no "trusted by 1000+ teams" logo strip, no big-number metric heroes (`98% retention`), no 3-tier pricing card grid.
- **Not a TaskRabbit-style consumer marketplace** — no urgency pricing, no "book in 30 seconds" claims, no celebratory checkmark animations on every step.
- **Not Lemonade Insurance** — though we share the conversational framing, we are NOT trying to be cute or playful. Lemonade can afford "your pet is super cute"; we cannot afford "your floors are super dirty." Adult tone wins.

## Design Principles

1. **Lead capture before completion.** The Info step (name, email, role, optional phone) is at position 3 of 7, not at position 7. We'd rather have an incomplete lead than no lead from someone who abandoned at Schedule. Every flow change preserves this rule.

2. **Editorial confidence, not editorial whimsy.** Every italic accent and Caveat flourish must serve a purpose: signal a transition, soften an ask, or warm a long step. If a script-font helper doesn't earn its place, cut it. We are not a wedding RSVP.

3. **Show one decision at a time.** No "fill in 14 fields" screens. Each step asks one thing (with one optional second thing). When a step looks crowded (Schedule has 14 selectable items), that's a signal to refactor the step, not to "polish" it.

4. **Sage on cream, never green-on-green.** Our palette is sage (`#2D7A32`) as the single accent on cream/peach neutrals. Green-on-green active states (the bug we fixed in Sprint 1) violate this — when an element activates, it should swap to sage-fill + white-text, not "lighter green on green." Contrast is non-negotiable.

5. **The form serves the sales team, not the user's vanity.** We do NOT congratulate the user for filling out a form. No confetti, no "great job!" copy, no progress dopamine. The reward is a quote, not a moment of delight.

## Accessibility & Inclusion

- **Target: WCAG 2.1 AA** across all form interactions.
- **Touch targets minimum 44px** (existing rule, audited per Sprint 1).
- **iOS Safari zoom prevention via 1rem font-size only** — never use `maximum-scale=1.0` (blocks pinch zoom, violates 1.4.4 Reflow). Per existing project lesson.
- **ARIA viewport-aware** — `aria-hidden` toggles via `matchMedia('(max-width: 900px)')` for elements that change visibility responsively.
- **Inert pattern** — staged screens use `[hidden]` + JS-toggled `inert` + `aria-hidden="true"` so screen readers don't traverse 7 form sections at once. (Hardened in Sprint 1.)
- **Semantic headings only** — h1 → h2 → h3 in order, no skips.
- **Reduced motion** — honor `prefers-reduced-motion`; the existing slide-keyframes between steps already crossfade instead of slide when this is set.
- **Color contrast** — 4.5:1 for body, 3:1 for large text. Sage `#2D7A32` on cream `#EEF2ED` passes 6.8:1.
- **No required fields that gate non-FM users.** "Your role" should be optional or chip-based, not free-text required (Sprint 2 fix).
