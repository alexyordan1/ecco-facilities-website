# Quote Wizard — Auditoría completa de pantallas (2026-08-18)

Método: 6 agentes auditores manejando el wizard real (headless Chromium) en 375/768/1280 px sobre los 3 flujos, + verificación adversarial por hallazgo serio. 37 agentes, 524 acciones de navegador, 3.07M tokens.

**Totales:** 39 confirmados (5 HIGH, 9 MEDIUM, 25 LOW), 8 refutados por el verificador.

Estado del árbol al auditar: pantalla 1 rediseñada (situation-first) sin commitear; resto del wizard = HEAD.

---

## HIGH

### H1. #qfScreen_schedule
**Archivo:** `/Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js:2833`  
**Qué pasa:** Every interaction inside a porter card destroys the focused element and drops keyboard focus to <body>, so a keyboard user is thrown back to the top of the page after each day-chip toggle.

**Evidencia medida:** dpRenderPorters() does `qfDpPortersHost.innerHTML = ''` and rebuilds every card, and dpRender() is called from dpToggleDay / dpApplyPreset / dpSetMode / dpSetTime / dpOpenPorter / dpRemovePorter. Measured with document.activeElement at 1280x900: focus the Saturday chip -> activeElement = BUTTON.qf2-chip qf-day-card|Saturday; press Enter -> aria-pressed flips to "true" (the toggle works) but activeElement = BODY. Same result for the accordion chevron (focus BUTTON.qf-dp-porter-chevron|Expand porter 1 -> Enter -> BODY), for the 'Every day' preset (-> BODY), and for the remove '×' button (-> BODY). Only #qfDpAddPorter survives, because it is static markup outside the re-rendered host. This is the densest screen in the wizard (7 day chips + 3 presets per porter, up to 6 porters), so configuring one porter Mon-Fri by keyboard costs 5 full re-Tabs from the document start.

**Fix propuesto:** Before the innerHTML wipe in dpRenderPorters(), record a stable identifier for document.activeElement (e.g. porter index + `data-day` / preset text / class), and after the rebuild re-focus the matching node. Alternatively patch the affected nodes in place (toggle .is-selected + aria-pressed on the clicked chip) instead of re-rendering the whole host on every day toggle.

### H2. #qfScreen_contact
**Archivo:** `js/quote-flow.js:3104`  
**Qué pasa:** The review screen's service caption ties Commercial Cleaning to a fixed time window: "Recurring after-hours cleaning".

**Evidencia medida:** Drove the janitorial flow (Office → Under 1,000 sq ft → Monday/Mornings → location → info) to #qfScreen_contact at 1280x800. #qf2SumService renders: "THE SERVICE / Commercial Cleaning / Recurring after-hours cleaning". Source: SERVICE_CAPTIONS = { janitorial: 'Recurring after-hours cleaning', ... } (js/quote-flow.js:3103-3108), rendered by buildService() into the QF2_REVIEW_SECTIONS 'service' row. This directly contradicts the welcome card the same user just clicked (quote.html:249 "Before, during, or after your business hours") and the 2026-08-10 law that Commercial Cleaning is never bound to a schedule. It is the last copy the prospect reads before submitting. The 'both' caption ('Day Porter plus Commercial Cleaning') and the dayporter caption ('On-site during business hours') are clean — only janitorial violates.

**Fix propuesto:** Replace the janitorial caption with a scope/cadence phrase that carries no time window, e.g. 'Recurring cleaning on your schedule' or 'Recurring cleaning — before, during, or after hours'.

### H3. Review (step 7) — 'The service' row
**Archivo:** `js/quote-flow.js:3104`  
**Qué pasa:** The review screen labels Commercial Cleaning as 'Recurring after-hours cleaning' — a fixed-window promise, directly violating the 2026-08-10 time-framing rule.

**Evidencia medida:** USER-VISIBLE. `var SERVICE_CAPTIONS = { janitorial: 'Recurring after-hours cleaning', ... }` — consumed by `buildService()` (js/quote-flow.js:3109-3111) which feeds `setStackedValue('qf2SumService', ...)`. `#qf2SumService` exists in quote.html:767, so this renders as the sub-line under 'The service' on every janitorial review. It also contradicts the welcome card the same user just clicked ('Before, during, or after your business hours', quote.html:249).

**Fix propuesto:** janitorial: 'Recurring cleaning on your schedule' (or 'Recurring cleaning, before, during, or after hours'). Keep dayporter: 'On-site during business hours' as-is.

### H4. Location (step 5) — atypical-schedule heads-up bubble
**Archivo:** `js/quote-flow.js:1864`  
**Qué pasa:** A JS-injected advisory bubble tells the user 'Most offices clean evenings or after hours', asserting exactly the fixed-window framing the rule forbids and implying their morning choice is wrong.

**Evidencia medida:** USER-VISIBLE (element is created at runtime, so it is not greppable in quote.html). Exact text: `sp + ' + ' + t + " is a bit unusual. Most " + sp.toLowerCase() + "s clean evenings or after hours. We'll double-check with you when we prepare the proposal."`. Reachable path: pick Office (quote.html:400) → Mornings only (quote.html:661) → Continue; `computeScheduleAtypical` returns true (js:342), `STATE.scheduleAtypical` is set at js:2406, and `renderAtypicalHeadsUp()` injects the bubble when the location screen activates (js:1841-1848). Same for Restaurant+Mornings and Medical+Evenings-only.

**Fix propuesto:** Reframe to a scheduling-confirmation, not a norm: 'Good to know — we’ll confirm the Mornings window with you when we prepare the proposal so the crew arrives when you want us.' Remove the 'Most Xs clean evenings or after hours' clause entirely.

### H5. Days (step 4) → Location — heuristic behind the heads-up
**Archivo:** `js/quote-flow.js:330-345`  
**Qué pasa:** computeScheduleAtypical() hard-codes the retired assumption that offices/restaurants clean evenings and medical cleans evenings, so it flags legitimate daytime cleaning as abnormal.

**Evidencia medida:** CODE-ONLY (no string rendered), but it is the sole trigger for the HIGH finding above. Comments state: 'Office cleans evenings normally, so morning-only is unusual. Restaurants clean off-hours (eve/night)... Medical clinics typically clean evenings'. Logic: `if (sp === 'office' && morningOnly) return true; if (sp === 'restaurant' && morningOnly) return true; if (sp === 'medical' && eveningOnly) return true;`

**Fix propuesto:** Delete the office/restaurant morning rules (cleaning can happen before, during, or after hours). If a heads-up is still wanted for a single narrow window, base it on window-width ('you picked only one window'), not on an assumed industry norm — and reword the bubble per the fix above.

## MEDIUM

### M1. #qfScreen_space
**Archivo:** `css/quote-noir.css:810`  
**Qué pasa:** The Space screen's Continue CTA is visible and clickable on arrival even though JS sets hidden=true — an ID-specificity rule defeats `.qf2-cta[hidden]{display:none}`, breaking the progressive-disclosure of the "Other" path and presenting a dead-end primary button.

**Evidencia medida:** Measured on arrival at #qfScreen_space (janitorial AND dayporter flows, at 375x812, 768x1024, 1280x800, nothing typed): `document.getElementById('qf2SpaceContinue').hidden === true` but `getComputedStyle(...).display === 'flex'` and rect.height === 52 (visible, clickable). Chrome CSS.getMatchedStylesForNode shows the winner is `#qfScreen_space .qf2-cta, #qfScreen_size .qf2-cta{display:flex}` at css/quote-noir.css:810 (specificity 1,1,0), overriding `.qf2-cta[hidden]{display:none}` at css/quote-noir.css:140 (specificity 0,2,0). Clicking it with the field empty does not advance; it renders the error "A few more letters so I know what we're walking into." So the JS toggles at js/quote-flow.js:1986 and js/quote-flow.js:2000 are inert. Screenshot at 1280 shows a full-width green Continue button under the 6 cards before any input. Same rule also covers #qfScreen_size.

**Fix propuesto:** Give the hidden state equal-or-higher specificity, e.g. add `#qfScreen_space .qf2-cta[hidden], #qfScreen_size .qf2-cta[hidden]{display:none}` next to line 810 (or replace `display:flex` with `width:100%` + `margin-inline:auto` so the base inline-flex/[hidden] cascade still wins).

> Severidad corregida por el verificador: HIGH → MEDIUM

### M2. #qfScreen_welcome
**Archivo:** `css/quote-noir.css:622`  
**Qué pasa:** The Welcome title gets SMALLER as the viewport grows: 41.6px at 860px wide, 35.2px at 880px wide. Below 880 it is also boxed into a 560px column while it needs 800px, forcing a 2-line wrap that disappears at 880 only because the box widens.

**Evidencia medida:** Swept viewport widths 360-1600 measuring computed font-size, rendered line count, and the natural single-line width (clone with white-space:nowrap, position:absolute, visibility:hidden): vw=820 -> fs 41.6px, avail 560, natural 800, lines 2; vw=860 -> fs 41.6px, avail 560, natural 800, lines 2; vw=880 -> fs 35.2px, avail 774, natural 800, lines 1. The title therefore drops 6.4px (-15%) crossing 880px upward. Cause: base `.qf2-prompt-title{font-size:clamp(1.85rem,5.2vw,2.6rem)}` at css/quote-noir.css:513 caps at 2.6rem=41.6px, then `@media(min-width:880px){.qf-screen.is-welcome .qf2-prompt-title{font-size:clamp(2.2rem,3.4vw,2.8rem)}}` at css/quote-noir.css:622 restarts at its 2.2rem=35.2px floor. Line break is otherwise clean at all widths — the <em>looking for</em> phrase never splits (em.getClientRects().length === 1 at every width) and the last line carries 4 words, so there is no orpha

**Fix propuesto:** Make the desktop clamp continuous with the sub-880 cap, e.g. `clamp(2.6rem,3.4vw,2.8rem)` at line 622 (natural width is 800px and the narrowest >=880 block is 774px, so 2.6rem/41.6px would need a slightly wider block or a small copy trim). Alternatively widen the sub-880 prompt box past 560px so the pre-breakpoint size is not fighting an artificially narrow column.

### M3. #qfScreen_welcome
**Archivo:** `css/quote-noir.css:1106`  
**Qué pasa:** The first-visit hint's dismiss button on the Welcome screen is a 30x30px touch target, below the repo's 44px minimum, and it is shown to every genuine first-time visitor at all viewports.

**Evidencia medida:** Measured on #qfScreen_welcome at 375x812, 768x1024 and 1280x800 (fresh localStorage, i.e. no `ecco_quote_seen_v1` flag): button.qf2-first-visit-dismiss rect height 30, width 30 — the only element under 44px on either of my screens. Rule: css/quote-noir.css:1106 `.qf2-first-visit-dismiss{...width:30px;height:30px;min-width:30px;...}`. The element is injected at js/quote-flow.js:5300 with aria-label="Dismiss" and appended to `.qf-screen.step-1`. Everything else on Welcome and Space passes: welcome cards 121px (375) / 101px (768) / 129px (1280), .qf2-both-link 44px, space cards 172px (375/768) / 137px (1280), .qf2-flowbar-back 44px, .qf2-flowbar-skip 44px, .qf2-cta 52px.

**Fix propuesto:** Raise to 44x44 (min-width/min-height:44px) and, if the pill must stay visually compact, keep the 30px painted circle but expand the hit area with padding or a ::before inset overlay.

### M4. #qfScreen_days
**Archivo:** `css/quote-noir.css:32 and :197 (tokens: css/noir.source.css:14 --ink-faint:#8B8F88)`  
**Qué pasa:** Days-screen supporting copy (.qf2-prompt-sub and .qf2-time-helper) fails WCAG AA 1.4.3 contrast (4.5:1) at all three viewports over the photographic backdrop.

**Evidencia medida:** Measured by clipping each element's rect twice (text visible vs visibility:hidden) and computing relative luminance of the real rendered backdrop against the computed text color rgb(139,143,136). Time cluster ungated (opacity 1) for these numbers. .qf2-prompt-sub (13.76px, weight 300, 'Pick the days and access windows: we size the crew and hours from your space.'): 375px = 3.34:1, 768px = 3.75:1, 1280px = 3.10:1 (worst 1% of backdrop 2.67:1). .qf2-time-helper (12.8px, weight 300, 'Your access window, not the length of the visit.'): 375px = 3.46:1 (worst 2.58:1), 768px = 3.26:1 (worst 2.63:1), 1280px = 3.81:1 (worst 2.92:1). AA minimum for text this size/weight is 4.5:1. Visible in the desktop screenshot: both lines all but disappear where the squeegee streak brightens the background photo.

**Fix propuesto:** On the photo-backed wizard screens use --ink-dim (#A8A89F) instead of --ink-faint for .qf2-prompt-sub / .qf2-time-helper, or raise the veil opacity behind the prompt block. #A8A89F on the same backdrops measures ~4.9-5.6:1. Alternatively add a localized scrim behind .qf2-prompt on .qf-stage:has(#qfScreen_days.is-active).

### M5. #qfScreen_size
**Archivo:** `css/quote-noir.css:32 and :171 (token css/noir.source.css:14 --ink-faint:#8B8F88)`  
**Qué pasa:** Size-screen .qf2-prompt-sub and the 'PREFER EXACT?' field label fail WCAG AA contrast at mobile and tablet.

**Evidencia medida:** Same clip-and-measure method. .qf2-prompt-sub (13.76px/300): 375px = 4.22:1, 768px = 4.13:1, 1280px = 4.84:1 avg but 2.66:1 over the brightest 1% of the hero-office photo. .qf2-numeric-label 'PREFER EXACT?' (11.52px/500, rgb(139,143,136)): 375px = 4.60:1, 768px = 4.35:1 avg and 2.87:1 at the 90th-percentile-bright backdrop, 2.13:1 at the 99th. AA needs 4.5:1. Note the size CARDS themselves measure fine (14.5-16.6:1) — only the --ink-faint copy fails.

**Fix propuesto:** Swap --ink-faint for --ink-dim on .qf2-prompt-sub and .qf2-numeric-label inside .qf-screen:not(.is-welcome), or darken the gradient veil on .qf-stage:has(#qfScreen_size.is-active) in the 20-60% band where the office photo is brightest.

### M6. #qfScreen_schedule .qf-dp-time-field
**Archivo:** `/Users/alexmercedes/Downloads/Ecco Webside/css/quote-noir.css:384`  
**Qué pasa:** The START / END labels are centered over their fields but the time value inside the input renders left-aligned, so each label floats ~150px away from the value it labels.

**Evidencia medida:** At 1280: START label text centre = 465.0 and its field centre = 465.0 (label was explicitly centered by css/quote-noir.css:431), but the input box spans l=295..635 with computed text-align `start`, so the '08:00 AM' glyphs begin at ~307 — about 158px left of the label above them. Identical geometry for END (label centre 815.0, input l=645..985). Same pattern at 880 (label 265 / input starts 107), 768 (label 249 / input starts 131), 560 and 375. Visible in the desktop screenshot: two centered mini-caps labels sitting over two left-hugging values, inside a card where everything else is centered.

**Fix propuesto:** Either add `.qf-dp-time-input{text-align:center}` under the `#qfScreen_schedule` centering block, or drop the label centering at css/quote-noir.css:431 so the label goes back to left, flush with its value. Pick one so label and value share an axis.

### M7. #qfScreen_location + #qfScreen_info
**Archivo:** `css/quote-noir.css:134 (rule) · quote.html:517 (#qf2LocErr) · quote.html:332,338,349 (.qf2-field-err in info)`  
**Qué pasa:** Validation error text is the ONLY left-aligned text on two otherwise fully-centered screens — and on the info screen it sits directly above a CENTERED sibling helper inside the same .qf2-fields container.

**Evidencia medida:** Measured getComputedStyle().textAlign at 375/768/1280, all three viewports identical. #qf2LocErr = 'start'; #qf2InfoErr_firstName = 'start'. Every sibling on the same screens = 'center': .qf2-prompt-title, .qf2-prompt-sub, .qf2-chip-label, .qf2-cta, .qf2-cta-hint, .qf2-location-hint / -label / -body, and .qf2-field-helper (#qf2EmailHelper) = 'center'. Desktop 1280 screenshot: the block is 640px wide starting at x=320; the error 'Please add your first name so we can send your proposal.' renders flush at x=320 while #qf2EmailHelper ('We’ll send your proposal here. No spam.') 150px below it is centered at x=522. Mobile 375: error wraps to 2 lines left-flush, orphaning 'proposal.' on line 2, immediately above the centered helper. Root cause: the 2026-06-26 standardization rule at css/quote-noir.css:527-529 centers .qf2-numeric-label, .qf2-field-helper and .qf2-atypical-heads-up-text on `.qf-

**Fix propuesto:** Add `.qf-screen:not(.is-welcome) .qf2-field-err, .qf-screen:not(.is-welcome) .qf-info-err` to the existing centering rule at css/quote-noir.css:527-529 (same list as .qf2-field-helper), so error copy inherits the screen's centered pattern.

### M8. #qfScreen_contact
**Archivo:** `quote.html:731-866`  
**Qué pasa:** The submit screen collects and posts PII with no visible privacy-policy link or data-use disclosure anywhere in the wizard.

**Evidencia medida:** At the moment of submit the screen holds first name, last name, email, optional phone, company name and street address, and #qfContactSubmit POSTs them to /api/submit-quote. Evaluated in-page at 1280x800: the only a[href*="privacy"] in the document is the footer link, and it reports vis:false with hiddenAncestor:true (#siteFooter carries both the `hidden` attribute and .q-flow-footer-hidden for the whole flow). The screen's own copy contains no consent or privacy sentence — the closest is the .qf2-trust chip "Privacy-first", which links nowhere. Full rendered text of #qfScreen_contact contains no occurrence of "privacy policy", "terms", or "agree".

**Fix propuesto:** Add a short line under the CTA, e.g. "By sending, you agree to our <a href=\"privacy.html\">Privacy Policy</a>." — it also covers the enhanced-conversions user_data disclosure requirement.

### M9. Review (step 7) — 'The service' row, Combined path
**Archivo:** `js/quote-flow.js:3102-3106`  
**Qué pasa:** On the Combined review row both service names appear in one view ('Combined' + 'Day Porter plus Commercial Cleaning') with no plain-language gloss, breaking the gloss-when-both-appear law.

**Evidencia medida:** USER-VISIBLE: primary `'Combined'` (js:3102) rendered into #qf2SumService, sub-line `'Day Porter plus Commercial Cleaning'` (js:3106). The welcome screen does this correctly (each card leads with the situation description and demotes the term to a tag, quote.html:248-257); the review screen drops the gloss entirely.

**Fix propuesto:** Sub-line: 'Someone on site through the day, plus recurring cleaning of the whole space.' Keep the service names in the primary line only.

## LOW

### L1. #qfScreen_space (and every other step screen)
**Archivo:** `quote.html:372`  
**Qué pasa:** The desktop 7-station flow-bar `.qf2-flowbar` never renders at any viewport — it is display:none globally and again inside the desktop media query — yet its full markup is duplicated in every screen section and JS keeps writing step counts into it.

**Evidencia medida:** Measured on #qfScreen_space at 375x812, 768x1024 and 1280x800: `getComputedStyle(.qf2-flowbar).display === 'none'` and rect 0x0 in all three, while `.qf2-flowbar-mobile` is display:flex in all three (h=70). Its hidden children still carry live text: `.qf2-flowbar-step-count` = "Step 2 of 7" (janitorial) / "Step 2 of 6" (dayporter), `.qf2-flowbar-skip` = "Save for later". Rules: css/quote-noir.css:82 `.qf2-flowbar{display:none}` and css/quote-noir.css:562 (inside @media min-width:880px) `.qf2-flowbar{display:none}`. The markup block is repeated per screen, e.g. quote.html:372-379 for Space and quote.html:326-333 for Info.

**Fix propuesto:** Delete the `.qf2-flowbar` header blocks from each screen section and the two display:none rules, or restore it if the wide desktop rail is still wanted. Also verify no JS getElementById on its children starts null-dereferencing after removal.

### L2. #qfScreen_welcome
**Archivo:** `css/quote-noir.css:565`  
**Qué pasa:** Dead CSS: a Welcome title font-size declared in the first @media(min-width:880px) block is fully overridden by an identical-specificity rule in a later 880px block, so editing it has no effect.

**Evidencia medida:** css/quote-noir.css:565 declares `.qf-screen.is-welcome .qf2-prompt-title{font-size:clamp(2.8rem,4.4vw,4rem);line-height:1}` inside @media(min-width:880px) starting at line 545; css/quote-noir.css:622 declares `.qf-screen.is-welcome .qf2-prompt-title{font-size:clamp(2.2rem,3.4vw,2.8rem);line-height:1.04}` inside the later @media(min-width:880px) starting at line 606. Same specificity, same media condition, later source wins. Measured computed values match line 622 exactly (35.2px at 880 = 2.2rem floor; 43.52px at 1280 = 3.4vw; 44.8px at 1440/1600 = 2.8rem ceiling) and never match line 565 (which would give 44.8px at 880 and 64px at 1600).

**Fix propuesto:** Remove line 565.

### L3. #qfScreen_space
**Archivo:** `css/quote-noir.css:739`  
**Qué pasa:** On desktop the Space screen renders two different content widths: the 6-card grid spans 1000px while the flow-bar (back arrow / Save), the "Other" field and the Continue CTA are capped at 560px and centered, leaving the back arrow floating 220px inside the card row.

**Evidencia medida:** Measured at 1280x800 on #qfScreen_space (both flows). .qf2-body block = 140..1140 (w=1000). .qf2-grid-6 = l 140, r 1140, gapL 0 / gapR 0. .qf2-flowbar-mobile = l 360, r 920, gapL 220 / gapR 220 (its .qf2-flowbar-back child rect l=361, r=405 — i.e. 221px right of the first card's left edge at 140). .qf2-space-other-wrap = l 360, r 920, gapL/gapR 220. .qf2-cta = l 360, r 920, gapL/gapR 220. Rules: css/quote-noir.css:739 `#qfScreen_space .qf2-flowbar-mobile{max-width:560px;margin-left:auto;margin-right:auto}` and css/quote-noir.css:743-744 `#qfScreen_space .qf2-space-other-wrap, #qfScreen_space .qf2-cta{max-width:560px;margin-left:auto;margin-right:auto}`, against css/quote-noir.css:741 `#qfScreen_space .qf2-grid-6{...max-width:none}`. Confirmed visually in a 1280x1000 screenshot: the back chevron and "Save" sit over the interior of the card row, not above its left/right edges. At 375 and 7

**Fix propuesto:** Either let the flow-bar span the full 1000px block (drop the max-width on line 739 for #qfScreen_space) so Back/Save align with the grid's outer edges, or cap .qf2-grid-6 at the same 560px. The flow-bar in particular should share the grid's left edge.

> Severidad corregida por el verificador: MEDIUM → LOW

### L4. #qfScreen_days
**Archivo:** `css/quote-noir.css:30 (.qf2-prompt-title font-size:clamp(1.55rem,4.6vw,2.05rem))`  
**Qué pasa:** The JS-injected days title wraps to two lines at <=375px viewports, unlike every other title in the flow which stays on one line; the fix width is computable.

**Evidencia medida:** Swept 320-1920px. #qfScreen_days .qf2-prompt-title renders 2 lines at 320/360/375px and 1 line from 414px up. At 375px: rendered width 335px, natural single-line width (clone with white-space:nowrap, position:absolute, visibility:hidden) = 371px, available block width 335px — 36px over. Font-size there is 29.6px, so 335/371 x 29.6 = 26.7px would fit on one line. The break is text-wrap:balance driven and lands as ['Which','days'] / ['should','we','clean?'] — it does NOT split the <em>days</em> (em getClientRects().length = 1) and leaves no orphan word, so it is legible; it simply costs 32.5px of vertical space that #qfScreen_size (1 line at the same viewport, natural 272 vs avail 335) does not. Same 2-line result for both the janitorial and both service variants, since S4_TITLES.janitorial and S4_TITLES.both are the identical string 'Which days should we clean?' (js/quote-flow.js:700 and 

**Fix propuesto:** If one line is wanted at 375px, lower the mobile floor of the .qf2-prompt-title clamp from 1.55rem to ~1.4rem, or add a #qfScreen_days-scoped max-width:768px override at ~1.45rem. Note the dayporter variant ('Which days do you need your porter?', natural width is longer still) will wrap at even more widths, so scope any fix to the injected-title screen rather than to one string.

### L5. #qfScreen_size
**Archivo:** `quote.html:578`  
**Qué pasa:** The 'Not sure' size card's aria-label does not contain its visible text, failing WCAG 2.5.3 Label in Name for speech-input users.

**Evidencia medida:** quote.html:578 sets aria-label="Not sure, schedule a visit" while the rendered visible text of the button is 'Not sure schedule visit' (from .qf2-size-visit-label 'Not sure' + .qf2-size-visit-hint 'schedule visit', confirmed by reading innerText at all three viewports). The accessible name is 'Not sure, schedule a visit', which does not contain the visible string 'Not sure schedule visit' (extra article 'a', inserted comma). A user saying 'click Not sure schedule visit' gets no match. Every other control on both screens passes: .qf2-numeric-input aria-label 'Enter exact square footage' is on an input with no visible label, and the chip-row aria-labels are group labels, not control names.

**Fix propuesto:** Change the aria-label at quote.html:578 to 'Not sure, schedule visit' (or drop the aria-label entirely and let the two spans form the accessible name), so the visible text is a contiguous substring of the accessible name.

### L6. #qfScreen_days
**Archivo:** `css/quote-noir.css:200`  
**Qué pasa:** The time-window chips' range sublabels sit just under the AA contrast threshold at mobile and tablet.

**Evidencia medida:** Measured on the ungated cluster (opacity 1). .qf2-chip-time-range 'loosely 6 am–noon' is 11.2px weight 300 in rgb(139,143,136): 375px = 4.25:1, 768px = 4.19:1, 1280px = 4.99:1. AA requires 4.5:1 for text this size. The chip LABELS ('Mornings' etc., --ink) are fine; only the range sublabels fail, and only below desktop.

**Fix propuesto:** Give .qf2-chip-time-range the --ink-dim token (or bump to weight 400) for the unselected state; the selected state already switches to --accent-soft and passes.

### L7. #qfScreen_schedule .qf-dp-porter-remove
**Archivo:** `/Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js:2891`  
**Qué pasa:** Removing a porter while every card is collapsed force-expands Porter 1 — an unrelated card the user never touched.

**Evidencia medida:** At 1280: added two porters, collapsed the open one, verified all three cards read ['qf-dp-porter is-collapsed','qf-dp-porter is-collapsed','qf-dp-porter is-collapsed']. Clicked '×' on Porter 3. Result: ['qf-dp-porter is-open','qf-dp-porter is-collapsed'] — Porter 1 popped open. Cause: dpUI.openIdx is -1 in the all-collapsed state, and line 2891 `if (dpUI.openIdx < 0) dpUI.openIdx = 0;` coerces that sentinel to index 0 instead of preserving it.

**Fix propuesto:** Guard the clamp so it only fires when openIdx was a real index that fell out of range: replace line 2891 with `if (dpUI.openIdx < -1) dpUI.openIdx = -1;`, leaving the -1 (all collapsed) sentinel intact.

### L8. #qfScreen_schedule .qf-dp-porter-edit
**Archivo:** `/Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js:2788`  
**Qué pasa:** The 'Edit' buttons carry no porter context in their accessible name while both of their sibling controls do, so with several porters a screen reader announces up to six identical 'Edit' buttons.

**Evidencia medida:** Accessible-name dump of #qfScreen_schedule with 2 porters: the chevron is 'Expand porter 1' / 'Collapse porter 2', the remove button is 'Remove porter 2', the day group is 'Porter 2 days' — but the .qf-dp-porter-edit node has no aria-label at all, so its name is just its text 'Edit'. With 6 porters (verified reachable, headers read 'Porter 1 … Edit ×' through 'Porter 6 ×') that is five indistinguishable 'Edit' buttons. The card element itself is an <article> with only data-porter-idx and no accessible name, so the surrounding context does not disambiguate them either.

**Fix propuesto:** Add `'aria-label': 'Edit porter ' + p.id` to the Edit button in dpRenderPorterCard (js/quote-flow.js:2788-2792), matching the pattern already used on the remove and chevron buttons; optionally give the <article> at line 2820 `aria-label: 'Porter ' + p.id`.

### L9. #qfScreen_schedule .qf-dp-porter-summary
**Archivo:** `/Users/alexmercedes/Downloads/Ecco Webside/css/quote-noir.css:362`  
**Qué pasa:** With per-day custom hours the collapsed porter summary has no clamp and expands into a multi-line paragraph inside the header row, breaking time tokens across lines.

**Evidencia medida:** Set porter 1 to Custom with Mon 6:30 AM-10:45 AM and Fri 1:15 PM-9:30 PM, then collapsed. Summary text 'Mon 6:30 AM–10:45 AM, Tue 8 AM–4 PM, Wed 8 AM–4 PM, Thu 8 AM–4 PM, Fri 1:15 PM–9:30 PM'. At 375px it renders 198px wide x 61.4px tall (3 lines, header 115.5px). At 320px it renders 143px wide x 102.3px tall (5 lines, header 156.4px) while ~122px of the header stays reserved for the Edit/chevron column; the break falls mid-time, orphaning 'AM,' onto its own line ('Mon 6:30 AM–10:45' / 'AM, Tue 8 AM–4 PM,'). computed white-space:normal, overflow:visible, text-overflow:clip — nothing truncates it. No horizontal overflow (scrollWidth 320 === innerWidth).

**Fix propuesto:** Clamp .qf-dp-porter-summary to 1-2 lines (-webkit-line-clamp with overflow:hidden), and/or add `white-space:nowrap` to the individual time tokens so a range never splits — the full detail is still available on expand and on the review screen, which was verified to render the per-day hours correctly.

### L10. #qfScreen_schedule .qf-dp-hours-mode-opt
**Archivo:** `/Users/alexmercedes/Downloads/Ecco Webside/css/quote-noir.css:377`  
**Qué pasa:** The 'Same hours' / 'Custom' pills are the only left-aligned text inside a porter card whose every other block is centered — the 2026-06-26 centering rule enumerates the card's children and omits this one.

**Evidencia medida:** Text-center vs pill-center offset (negative = text sits left of pill centre), measured with a Range over each label: 375px -> -24.4 / -37.8 ; 560px -> -66.7 / -80.0 ; 768px -> -80.7 / -94.0 ; 880px -> -120.7 / -134.0 ; 1280px -> -120.6 / -134.0. computed text-align on the label is `start`. Every sibling in the same card measures dead-centre at the same widths: .qf2-section-label offset 0 (text-align:center), .qf-dp-time-summary centered, .qf-dp-day-row and .qf-dp-presets and .qf-dp-team-preview have justify-content:center, and .qf-dp-time-field label is centered. The omission is visible in css/quote-noir.css:428-431, which lists `.qf2-section-label, .qf-dp-time-summary, .qf-dp-custom-day, .qf-dp-time-field label` but not `.qf-dp-hours-mode-opt`. At 1280 the 'Custom' word starts 134px left of the centre of its own 341px-wide pill.

**Fix propuesto:** Add `.qf-dp-hours-mode-opt` to the `#qfScreen_schedule ... {text-align:center}` group at css/quote-noir.css:428-431 (or set text-align:center on the base rule at :377).

> Severidad corregida por el verificador: MEDIUM → LOW

### L11. #qfScreen_schedule #qfDpStatus / #qfDpScheduleContinue
**Archivo:** `/Users/alexmercedes/Downloads/Ecco Webside/css/quote-noir.css:401`  
**Qué pasa:** In the blocked state the Continue button is disabled and silent, and the blocking reason renders in the same neutral faint gray as the idle state — the error is the least prominent state on the screen while success gets accent green.

**Evidencia medida:** Cleared all days on porter 1 at 375px: #qfDpScheduleContinue.disabled === true, computed opacity 0.6, pointer-events auto; #qfDpStatus reads 'Pick at least one day for porter 1' with computed color rgb(139,143,136) — that is --ink-faint, the same value the status uses when idle. The success state gets `.is-ok{color:var(--accent-soft)}` (css/quote-noir.css:409) but there is no error colour rule for this element. Forcing a click on the disabled CTA leaves the wizard on qfScreen_schedule with no toast rendered, because the toast branch in the click handler (js/quote-flow.js:2969) can never run on a disabled button. The only strong signal is the red card border from `.qf-dp-porter.is-error` (verified: className became 'qf-dp-porter is-open is-error').

**Fix propuesto:** Add a `.qf-dp-cta-status.is-error{color:#E8A0A0}` rule and toggle it in dpRenderCTA() (js/quote-flow.js:2861-2864) alongside the existing .is-ok toggle, so the blocking reason reads as an error rather than as chrome.

> Severidad corregida por el verificador: MEDIUM → LOW

### L12. #qfScreen_info
**Archivo:** `quote.html:318 (<h2 class="qf2-prompt-title">) · css/quote-noir.css:895 (#qfScreen_info .qf2-prompt-title font-size)`  
**Qué pasa:** The info title wraps to 2 lines at every viewport including 1280px desktop, while its sibling location screen — same 640px block, same font-size clamp — fits on one line, breaking the screens' shared single-line pattern.

**Evidencia medida:** Clone-with-white-space:nowrap measurement. Desktop 1280: #qfScreen_info title natural nowrap width = 776px vs available block width = 640px (font-size 46.08px, height 101px = 2 lines, break 'Last thing: where do' / 'we send your proposal?'). Same screen at 768 tablet: 746px natural vs 560px available, 2 lines. Same at 375: 560 vs 335, 2 lines. #qfScreen_location title on the identical 640px block at 1280: 478px natural vs 640px available → 1 line (height 51px), and at 768: 459 vs 560 → 1 line. Both screens are capped at max-width:640px (css/quote-noir.css:877, :895) and share font-size:clamp(2.2rem,3.6vw,3rem). The break itself is balanced (4 words / 4 words) and does not split the <em> (em.getClientRects().length = 1) — hence LOW, not HIGH.

**Fix propuesto:** To fit one line on desktop the info title needs ≈38px: 640/776 × 46.08 = 38.0px. Either lower the clamp ceiling at css/quote-noir.css:895 to clamp(2.2rem,3.6vw,2.35rem), or shorten the copy at quote.html:318 (e.g. 'Where do we send your proposal?' measures ~600px at 46px and fits the 640px block).

### L13. #qfScreen_info + #qfScreen_location
**Archivo:** `quote.html:360-361 (info) · quote.html:518-519 (location)`  
**Qué pasa:** Both chip groups carry an aria-label that does not contain the visible label rendered immediately above them, so screen-reader and voice-control users hear a different name than sighted users read.

**Evidencia medida:** info: visible <span class="qf2-chip-label">Quick one: do you have cleaning now?</span> (quote.html:360) vs the adjacent <div class="qf2-chip-row" role="group" aria-label="Current situation"> (quote.html:361). location: visible 'When do you want to start?' (quote.html:518) vs aria-label="Desired start" (quote.html:519). Neither .qf2-chip-label span has an id, and neither group uses aria-labelledby. Measured accessible names in-page: group names return 'Current situation' / 'Desired start'; the individual chips themselves are clean (aria-label = null, visible text only).

**Fix propuesto:** Give each .qf2-chip-label an id (e.g. id="qf2InfoSituationLabel" / id="qf2LocTimelineLabel") and replace the group's aria-label with aria-labelledby pointing at it, so the accessible name equals the visible text.

### L14. #qfScreen_location + #qfScreen_info
**Archivo:** `css/quote-noir.css:131 (.qf2-field input:focus{outline:none}) · css/quote-noir.css:126 (.qf2-field:focus-within{border-color:var(--accent)})`  
**Qué pasa:** Text inputs have no focus outline — the site-wide :focus-visible ring is suppressed and the only keyboard-focus signal is a 1px wrapper border-color change that also fires on mouse click.

**Evidencia medida:** Real keyboard focus (Tab then Shift+Tab onto #qfCompanyName) at 375x812: document.activeElement='qfCompanyName', el.matches(':focus-visible')=true, yet computed outlineStyle='none' (outline-width 3px, color rgb(244,242,236) — inert because style is none), input boxShadow='none', wrapper outlineStyle='none', wrapper boxShadow='none'. The single change is wrapper borderColor rgba(244,242,236,0.18) → rgb(159,203,123), i.e. 1px. noir.css:1 defines :focus-visible{outline:2px solid var(--accent);outline-offset:3px} globally, which css/quote-noir.css:131 cancels for these inputs. Because the indicator comes from :focus-within it is identical for pointer focus, so there is no keyboard-specific affordance, and 1px over the photographic stage background is thin.

**Fix propuesto:** Scope a keyboard-only ring back on, e.g. `.qf2-field:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}` — the same :has(input:focus-visible) pattern already used for the day-porter hours pill at css/quote-noir.css:416.

### L15. #qfScreen_location
**Archivo:** `quote.html:517 (<p class="qf2-field-err" id="qf2LocErr">, sibling AFTER the .qf2-fields div that closes at line 516)`  
**Qué pasa:** The location screen uses ONE shared error node placed after all three fields, so an address error renders 70px below the address input with the optional Suite/Floor field in between — while the sibling info screen correctly puts each error in its own .qf2-field-block next to its input.

**Evidencia medida:** Filled #qfCompanyName='Test Co', left #qfAddress empty, clicked #qfLocationContinue. Measured at 375x812 and 1280x800 (identical): #qf2LocErr text = 'Where should we send the team? A street address, building name, or ZIP all work.'; errRect.top - #qfAddress wrapper .bottom = 70px at both viewports; #qfSuite wrapper occupies that gap (its bottom is 480 vs error top 487 on mobile; 533 vs 540 on desktop). Screenshot li-addrerr-mobile.png shows the red-bordered 'Service address' field, then an untouched 'Suite / Floor (optional)' field, then the red message. Contrast: #qfScreen_info wraps first/last/email each in .qf2-field-block with its own .qf2-field-err (quote.html:329-350), rendering the message directly under the offending input (measured 8px gap).

**Fix propuesto:** Mirror the info-screen structure: wrap each location field in a .qf2-field-block and give #qfCompanyName / #qfAddress their own .qf2-field-err nodes (e.g. qf2LocErr_company / qf2LocErr_address), keeping the existing aria-invalid + aria-describedby wiring in js/quote-flow.js:1759-1811.

> Severidad corregida por el verificador: MEDIUM → LOW

### L16. #qfScreen_contact
**Archivo:** `css/quote-noir.css:304-308`  
**Qué pasa:** The "what happens next" strip stays a 3-column grid at 375px, dropping to 11.5px text with ragged 2-3 line wraps.

**Evidencia medida:** Measured at 375x812: .qf2-rv-next is display:grid; grid-template-columns:repeat(3,1fr) with no single-column breakpoint, giving ~105px columns inside the 335px block. .qf2-rv-next-what computes to font-size .72rem = 11.52px (media max-width:520px, line 308). Rendered result: column 1 "We prep your proposal" wraps to 2 lines, column 2 header "WITHIN ONE BUSINESS DAY" wraps to 2 lines plus body to 2 lines, column 3 "A quick call, only if you want one" wraps to 3 lines — the three items end at three different baselines (block height 80px vs 49px on desktop). Every other text element on the screen is >=13px.

**Fix propuesto:** Below ~520px switch .qf2-rv-next to a single column (or two) and restore .qf2-rv-next-what to .78rem.

### L17. #qfScreen_success
**Archivo:** `quote.html:873`  
**Qué pasa:** Desktop/tablet success subtitle promises "within 24 hours on business days" while the mobile variant of the same sentence, the timeline below it, and the review screen all promise "one business day".

**Evidencia medida:** After stubbing /api/submit-quote and submitting: at 1280x800 and 768x1024 .qf2-success-subtitle reads "Your request is in. We'll reach out within 24 hours on business days." At 375x812 the .qf2-prompt-sub-mobile sibling reads "We'll reach out within one business day." Two lines below, .qf2-timeline-when[1] reads "WITHIN ONE BUSINESS DAY" on desktop and "1 BUSINESS DAY" on mobile, and #qfScreen_contact's .qf2-cta-hint reads "Your proposal, in your inbox within one business day." A 24-hour clock promise and a one-business-day promise are different commitments shown to different viewport users for the same submission.

**Fix propuesto:** Make the desktop span match the mobile/timeline wording: "Your request is in. We&rsquo;ll reach out within one business day."

> Severidad corregida por el verificador: MEDIUM → LOW

### L18. #qfScreen_success
**Archivo:** `quote.html:932`  
**Qué pasa:** The "see what a thorough clean covers" link on the success screen is 15px tall at 375px, far below the 44px touch-target rule.

**Evidencia medida:** Measured at 375x812 after submit: the <a> inside p.qf2-success-next has getBoundingClientRect().height = 15px, width = 216px (it is a bare inline anchor with no padding or display:inline-flex). Every other interactive element on the screen passes (.qf2-cta 58px, .qf2-back-link 44px, .qf2-reference-id 44px). Repo hard rule: touch targets minimum 44px with display:inline-flex.

**Fix propuesto:** Give the anchor display:inline-flex; align-items:center; min-height:44px (or vertical padding) in the .qf2-success-next rule of css/quote-noir.css.

> Severidad corregida por el verificador: MEDIUM → LOW

### L19. Space 'other' error, Review badge, Location out-of-area bubble
**Archivo:** `js/quote-flow.js:2021`  
**Qué pasa:** JS-injected copy mixes ASCII apostrophes with typographic U+2019 within the same flow, so identical constructions render with different glyphs screen to screen.

**Evidencia medida:** USER-VISIBLE. ASCII: js:2021 "A few more letters so I know what we're walking into."; js:1907 " that's outside NYC. Want us to add you to the waitlist?"; js:3163 "We'll confirm the details.". Typographic U+2019: js:3149 "We’ll measure on-site...", js:3191 "We’ll set it up, no obligation.", js:3431 "We’ll ...". (Note these are textContent, so HTML entities must NOT be used here — the fix is the literal U+2019 character.)

**Fix propuesto:** Replace the ASCII apostrophes in these textContent strings with ’: "what we’re walking into", "that’s outside NYC", "We’ll confirm the details."

### L20. Success (step 8) — legacy subtitle (currently unrendered)
**Archivo:** `js/quote-flow.js:4746`  
**Qué pasa:** Legacy success subtitle promises delivery 'shortly' with no business-day qualifier.

**Evidencia medida:** CODE-ONLY (`qfSuccessSub` has 0 matches in quote.html): `successSub.textContent = 'Check ' + STATE.userEmail + '. Your custom plan will be there shortly.';`. The live V2 markup correctly says 'within 24 hours on business days' (quote.html:873).

**Fix propuesto:** Delete, or 'Check <email>. Your proposal arrives within one business day.'

### L21. Social/link preview for /quote
**Archivo:** `quote.html:20`  
**Qué pasa:** The og:description exposes 'janitorial' and lowercase 'day porter' in the text users see in link previews; metadata is permitted for the keyword, but the casing drifts from the canonical service name.

**Evidencia medida:** `<meta property="og:description" content="A quick 2-minute form. Get a free, customized proposal for janitorial or day porter services, delivered within one business day.">`. Compare the compliant meta description at quote.html:18 ('Commercial Cleaning and Day Porter service across New York City').

**Fix propuesto:** 'A quick 2-minute form. Get a free, customized Commercial Cleaning or Day Porter proposal, delivered within one business day.'

### L22. Footer (hidden on this page)
**Archivo:** `quote.html:951`  
**Qué pasa:** Footer brand line uses user-facing 'janitorial'; harmless while the footer is hidden, but it is one attribute away from rendering.

**Evidencia medida:** `<p>Premium janitorial and facility services across New York City, with eco-certified products on every job.</p>` inside `<footer class="footer q-flow-footer-hidden" id="siteFooter" hidden>` (quote.html:943) — NOT user-visible on quote.html as shipped. Note the eco claim itself is correctly product-scoped ('eco-certified products'), which is compliant.

**Fix propuesto:** 'Premium commercial cleaning and facility services across New York City, with eco-certified products on every job.'

### L23. Welcome / resume banner / 'Starting fresh' toast / Review / confirmation email
**Archivo:** `js/quote-flow.js:745`  
**Qué pasa:** The combined-service name drifts across four user-visible surfaces: 'Combined' (welcome + review), 'Both Services' (resume banner + toast), 'Both services' (legacy review), 'Commercial Cleaning & Day Porter' (email) — four names for one product in one funnel.

**Evidencia medida:** USER-VISIBLE in all four. quote.html:261 `data-service-label="Combined"` and the button reads 'Need both? One team can handle both'. js/quote-flow.js:745 `SERVICE_LABELS = { ... both: 'Both Services' }` → surfaces in the resume-dismiss toast at js:1319-1325 ('New proposal with Both Services. Your previous answers were cleared.'). js/quote-flow.js:5130 `var SERVICE_NAMES = { ... both:'Both Services' ... }` → resume banner 'Last time you picked Both Services' (js:5153-5155). js/quote-flow.js:3102 review row `both: 'Combined'`. functions/api/submit-quote.js:958 `formType === 'both' ? 'Commercial Cleaning & Day Porter'` → printed in the client email at line 167 ('Re: Proposal REF · Commercial Cleaning & Day Porter').

**Fix propuesto:** Pick ONE user-facing name and propagate: 'Commercial Cleaning + Day Porter' everywhere (it is self-glossing and obeys the naming law). Set js:745 both:'Commercial Cleaning + Day Porter', js:5130 both:'Commercial Cleaning + Day Porter', js:3102 both:'Commercial Cleaning + Day Porter', submit-quote.js:958 'Commercial Cleaning + Day Porter', and change quote.html:261 data-service-label to match. If the short 'Combined' is kept as the welcome-card affordance, it must still resolve to the full name in the rail, toast, review and email.

> Severidad corregida por el verificador: HIGH → LOW

### L24. Review 'What happens next' + Success timeline vs confirmation email
**Archivo:** `functions/api/submit-quote.js:169`  
**Qué pasa:** The email promises an outbound specialist call as a certainty while the wizard promises a call only if the client wants one — the same step, two different commitments.

**Evidencia medida:** USER-VISIBLE both sides. Email step III: 'A specialist reaches out to walk you through it and answer any questions.' (submit-quote.js:169, mirrored in the text part at line 197). Wizard: quote.html:856 'A quick call, only if you want one' and quote.html:911 'A quick call or site walk, only if you want one.' Also js/quote-flow.js:3183 sets the same row to 'A quick call, only if you want one'.

**Fix propuesto:** Align the email to the wizard's opt-in framing: 'A specialist is available to walk you through it, whenever you want a call.' (and the same in the text body).

> Severidad corregida por el verificador: MEDIUM → LOW

### L25. No-JS fallback (visible when JavaScript is disabled)
**Archivo:** `quote.html:169`  
**Qué pasa:** Rendered copy uses a literal ASCII apostrophe instead of &rsquo;, the only such leak in quote.html's visible text.

**Evidencia medida:** USER-VISIBLE with JS off: `Or email us directly and we'll reply within 24 hours on business days with a custom cleaning proposal:`. Every other visible string in the file uses the entity (e.g. quote.html:243 `you&rsquo;re`, 256 `you&rsquo;re`, 350 `We&rsquo;ll`).

**Fix propuesto:** `we&rsquo;ll`.

> Severidad corregida por el verificador: MEDIUM → LOW

---

## Refutados (reportados pero descartados al verificar)

- **#qfScreen_space (vs #qfScreen_welcome)** — At >=880px the Welcome title is left-aligned flush with the content row but the very next screen (Space) centers its title — adjacent steps contradict each other at the same breakpoint.  
  _Motivo del descarte:_ Measurements reproduce, but the conclusion doesn't hold — this is intentional, documented design, not a defect.
- **#qfScreen_welcome -> #qfScreen_space** — The content column changes width between Welcome (920px) and Space (1000px), so the whole layout jumps 40px to the left on the very first screen transition at >=880px.  
  _Motivo del descarte:_ Numbers reproduce exactly (1280x800: welcome .qf2-body x=180/w=920, space x=140/w=1000; same delta at 1440 and 1920; no delta at 880/900 where both clamp to 774.4/792). But the reading is an artifact, not a defect. (1) Nothing persists across the transition: sampling the DOM every 60ms through the c
- **#qfScreen_size + #qfScreen_days** — At >=880px the welcome title is left-aligned flush with its content row while the size and days titles are centered — the established welcome pattern is contradicted by both of my screens (though welcome is the minority: every other screen is centered).  
  _Motivo del descarte:_ Reproduced the measurements exactly, then found they describe intentional design rather than a defect.
- **Welcome (step 1) — Day Porter card** — The Day Porter card lists 'supplies' among what the service covers, which a reader can fairly take as Ecco supplying paper/soap/liners inside the quoted rate.  
  _Motivo del descarte:_ REPRODUCED THE STRING, REFUTED THE DEFECT.
- **Review — legacy V1 summary builder (currently unrendered)** — The legacy review builder writes 'After-hours cleaning' as the Combined cleaning sub-line, a fixed-window claim that ships one markup change away from being visible.  
  _Motivo del descarte:_ REFUTED — the string is unreachable dead code, not user-visible copy.
- **Review — legacy V1 summary builder (currently unrendered)** — Legacy review sub-lines put the word 'janitorial' in user-facing copy, which is banned from user-visible surfaces.  
  _Motivo del descarte:_ REFUTED — the strings are unreachable dead code, not user-visible copy.
- **Welcome — retired 'Not sure?' quiz result (currently unrendered)** — Dead quiz labels carry both a fixed-window claim and user-facing 'janitorial'.  
  _Motivo del descarte:_ Refuted — the strings are unreachable dead code, never rendered in any state.
- **Success (step 8) — legacy timeline dates (currently unrendered)** — Legacy success-timeline code derives promise dates from calendar days (+1/+2), not business days, so a Friday or Saturday submission would promise a weekend delivery.  
  _Motivo del descarte:_ REFUTED — dead code, zero user impact.

## Verificado aparte (no delegado)

- **C1 (junio, catastrófico):** los IIFEs de arranque ya NO están atrapados tras el early-return de offerResume. Probado end-to-end: visitante nuevo → firstVisitHint corre; al llegar a revisión, Turnstile se inyecta (1 request). Sin regresión.
- **C2 (junio, catastrófico):** sin lookbehind en el regex de email ni en cliente ni en servidor. Sin regresión.
