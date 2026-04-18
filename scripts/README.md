# Scripts

## `optimize-avatar.mjs`
Regenerates the 3 WebP + AVIF + JPEG variants of `images/alina-avatar.jpg`.

```bash
node scripts/optimize-avatar.mjs
```
Outputs `alina-avatar-{96,192,480}.{webp,avif,jpg}` under `/images/`.

Run whenever the source portrait is replaced. Variants are tracked in git.

---

## CSS coverage audit (Sprint 1 · T0.4 phase 1 — manual DevTools)
Goal: identify unused CSS selectors in `css/quote-flow.css` to purge in Sprint 6.

1. Serve the site locally (preview server on :8080 or `npx serve .`).
2. Open `http://localhost:8080/quote.html` in Chrome Incognito.
3. DevTools → ⋮ → More Tools → **Coverage**.
4. Click the reload-and-record button (●) and complete a flow:
   - Run 4 passes total — one per `data-service`: janitorial, dayporter, both, unsure.
   - For each pass: complete through to the success screen, editing at least one inline field in the plan card.
5. After each pass, sort by `% Unused`, right-click `quote-flow.css` → **Export all**.
6. Merge the 4 JSON exports locally. A selector is "dead" only if unused in ALL four passes.
7. Save the merged diff to `.coverage/quote-flow-dead-YYYY-MM-DD.txt` (gitignored).

During Sprint 1 we only produce the audit; purging happens in Sprint 6 after regression visual baselines exist.

---

## Known dark-mode limitation — Google Places autocomplete

Google Maps `.pac-container` (the address autocomplete dropdown) is rendered by the Maps JS SDK directly into `<body>` and **is not styleable by our CSS**. When the OS preference is dark, the dropdown still paints with its light default theme — white background, dark text — which looks inconsistent next to our dark-mode quote page.

**Why not fixed:** Google explicitly discourages overriding `.pac-container` because any selector we'd need (`.pac-item`, `.pac-matched`, etc.) can change between SDK versions. Attempting to force-style it caused tooltip misalignment in production.

**Workaround considered:** Migrating to the newer `PlaceAutocompleteElement` (slotted Web Component) would allow dark-mode styling, but is a behavioral change that needs its own verification pass. Tracked in-code at [quote.html line 39](../quote.html) as a TODO.

**Accept:** This is a known limitation. Users in dark mode see a light autocomplete dropdown momentarily while typing their address; once they pick a result, the dropdown closes and the page returns to a cohesive dark theme.
