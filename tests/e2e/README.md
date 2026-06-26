# Quote-wizard E2E suite

Playwright tests that drive the live `quote.html` wizard step-by-step and assert
each service path advances without console errors. They exist to catch the class
of **silent-fail** bugs that static audits miss (e.g. a dead `#qfSizeSubmit`
reference, or a flow step that no-ops).

## Run it

```bash
# Desktop Chrome (the primary project)
npx playwright test --project=desktop-chrome --reporter=line

# A single spec / single test
npx playwright test --project=desktop-chrome janitorial-flow.spec.js
npx playwright test --project=desktop-chrome -g "full happy path"
```

`playwright.config.js` boots the local dev server itself
(`webServer: node serve.js` on `:8080`) and reuses an already-running one
locally. **Make sure nothing else is bound to `:8080`** or the server won't
start. No `.env`, no API keys, no manual setup.

## No network or external deps required

A past investigation assumed the suite needed Google Places / Cloudflare
Turnstile / GTM to load. **It does not.** The wizard degrades gracefully and the
tests never depend on third-party scripts:

| External dep        | Why the suite doesn't need it |
|---------------------|-------------------------------|
| Google Places       | Lazy-loaded on address-field focus; address validation is **soft** (company non-empty + address ≥ 4 chars). `fillLocation()` types raw text and Continue accepts it. |
| Cloudflare Turnstile| Submit path does `if (!window.turnstile) return resolve(null)` — no token, submit still fires. Happy-path tests stop at the contact screen and never submit. |
| GTM / dataLayer     | The wizard creates `window.dataLayer` itself and pushes events directly, so telemetry assertions work with GTM absent. |
| `/api/submit-quote` | The few submit tests stub it with `page.route(...)` — no real lead is sent. |

So a red suite is **not** evidence that the live wizard is broken — verify the
live site (eccofacilities.com/quote.html) before suspecting wizard code.

## Flow order is a MIRROR of `FLOWS` in `js/quote-flow.js`

The single most important maintenance rule. The per-service step order lives in
one place — `var FLOWS` near the top of `js/quote-flow.js` — and the tests must
match it exactly. As of 2026-06-20 the `info`/"You" step (name + email) was
moved from right-after-Space to the **end** of every flow, just before Contact:

| Service     | Step order |
|-------------|-----------|
| janitorial  | Welcome → Space → Size → Days → Location → **Info** → Contact |
| dayporter   | Welcome → Space → Schedule → Location → **Info** → Contact |
| both        | Welcome → Space → Size → Days → Schedule → Location → **Info** → Contact |

**If you reorder, rename, or insert a flow step in `quote-flow.js`, update these
specs in lockstep.** A stale order makes nearly every multi-step test time out
in `expectActive(...)` — the page advances to the real next screen while the
test waits for the screen the old order expected. (See the memory lesson
"Wizard reorder mirror-obligations".)

## How the helpers work

`helpers.js` exposes one helper per screen (`pickSpace`, `pickSize`,
`pickSchedule`, `pickPorterSchedule`, `fillLocation`, `fillInfo`, …). They are
**order-agnostic**: each performs that screen's actions and clicks its Continue.
The specs decide the order. After every navigating click, call
`expectActive(page, 'qfScreen_<name>')` — it waits for the `.is-active` class and
then clears the 400 ms `_qfTransitioning` guard, so the next click isn't
swallowed mid-transition.

## Projects

Both projects run the same specs and are **fully green** (40/40 each, 80 total):

```bash
npx playwright test                       # both projects
npx playwright test --project=mobile-safari
```

- `desktop-chrome` — primary, 1280×800.
- `mobile-safari` — iPhone 13 (WebKit, touch, no hover). The shared helpers
  (`freshOpen`, the flowbar back button via `[data-qf2-back]:visible`) already
  cope with the touch/mobile layout differences. If only one project goes red,
  suspect a viewport-specific layout/interaction issue before a wizard regression.
