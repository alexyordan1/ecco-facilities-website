// @ts-check
const { expect } = require('@playwright/test');

/**
 * Shared helpers for the quote-form E2E suite.
 * Real flow order (per the desktop flow-bar): Welcome → Space → Info → Size → Days → Location → Contact.
 *
 * Every helper guards against the cookie banner intercepting clicks
 * by dismissing it on first visit, and surfaces JS errors via pageerror.
 */

async function dismissCookieBanner(page) {
  // The banner is opt-in via "Accept" / "Decline". Auto mode picks Decline
  // for privacy preservation. Use a short-timeout selector — banner may not
  // render in some test paths.
  try {
    const declineBtn = page.locator('button', { hasText: /^Decline$/ }).first();
    if (await declineBtn.isVisible({ timeout: 1500 })) {
      await declineBtn.click({ timeout: 1500 });
    }
  } catch (_) { /* not visible — already dismissed or N/A */ }
}

/**
 * Open the quote form fresh — clears localStorage, reloads, dismisses
 * the cookie banner. Captures JS errors for later assertion.
 */
async function freshOpen(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });

  await page.goto('/quote.html');
  await page.evaluate(() => {
    try { localStorage.removeItem('ecco_quote_draft_v1'); } catch (_) {}
  });
  await page.reload();
  await page.waitForSelector('.qf-screen.is-active');
  await dismissCookieBanner(page);
  page._jsErrors = errors;
  return errors;
}

async function expectActive(page, expectedId) {
  await expect(page.locator(`#${expectedId}`)).toHaveClass(/is-active/, { timeout: 5000 });
  // D26 — guard reduced 850 → 400ms; tests wait 500ms to clear it. Plus the
  // queued-nav fallback in the JS means a click during the lock will still
  // execute when released, so timing is forgiving.
  await page.waitForTimeout(500);
}

function expectNoJsErrors(page) {
  // Filter known-benign console noise: third-party scripts, browser warnings
  // about meta-tag-only headers, preload hints, and Cloudflare Turnstile dev
  // errors. The signal we care about is JS pageerrors and same-origin script
  // throws — anything else is noise that masks real failures.
  const benignPatterns = [
    /Failed to load resource/i,
    /favicon/i,
    /maps\.googleapis/i,
    /gtag/i,
    /clarity/i,
    /hubspot/i,
    /turnstile/i,
    /challenges\.cloudflare/i,
    /X-Frame-Options? may only/i,
    /X-Frame-Option .*supplied in a <meta>/i,
    /preloaded using link preload but not used/i,
    /Content Security Policy/i,
    /allow="autoplay"/i,
    /Protocols must match/i,
    /accessing a frame with origin/i,
  ];
  const meaningful = (page._jsErrors || []).filter((e) =>
    !benignPatterns.some((re) => re.test(e))
  );
  expect(meaningful).toEqual([]);
}

/**
 * Step 2 (SPACE) — pick a space card by data-space value.
 */
async function pickSpace(page, space = 'Office') {
  await page.click(`.qf2-card[data-space="${space}"]`);
}

/**
 * Step 3 (YOU / Info) — fill name + email. Role is optional now.
 */
async function fillInfo(page, opts = {}) {
  const o = Object.assign({
    first: 'Test',
    last: 'User',
    email: 'test+e2e@example.com',
    role: '',
  }, opts);
  await page.fill('#qfUserFirstName', o.first);
  await page.fill('#qfUserLastName', o.last);
  await page.fill('#qfUserEmail', o.email);
  if (o.role) await page.fill('#qfUserPosition', o.role);
  await page.click('#qfInfoContinue');
}

/**
 * Step 4 (SIZE) — pick a card by data-size.
 */
async function pickSize(page, size) {
  await page.click(`.qf2-size-card[data-size="${size}"]`);
}

/**
 * Step 4 (SIZE) — type exact sq ft + Continue.
 */
async function pickSizeExact(page, sqft) {
  await page.fill('#qfSizeCustom', String(sqft));
  await page.click('#qf2SizeContinue');
}

/**
 * Step 5 (SCHEDULE) — pick a single day chip then Continue. Per D49,
 * a time window is now REQUIRED, so we always click one (defaults to
 * 'morning' if the caller doesn't specify).
 */
async function pickSchedule(page, day = 'Monday', time = 'morning') {
  await page.click(`#qfScreen_days .qf-day-card[data-day="${day}"]`);
  await page.click(`#qfScreen_days .qf2-chip-time[data-time="${time}"]`);
  await page.click('#qfDaysContinue');
}

/**
 * Step 6 (LOCATION) — fill company + address.
 */
async function fillLocation(page, opts = {}) {
  const o = Object.assign({
    company: 'Test Co',
    address: '123 Main St, New York, NY 10001',
  }, opts);
  const companyField = page.locator('input[id*="ompany"]').first();
  if (await companyField.count()) await companyField.fill(o.company);
  const addrField = page.locator('input[id*="ddress"]').first();
  if (await addrField.count()) await addrField.fill(o.address);
  await page.click('#qfLocationContinue');
}

/**
 * D55 — Day Porter SCHEDULE screen helper. Configures one or more porters
 * with their days + hours, then clicks Continue.
 *
 * opts.porters: array of porter configs (1..6). Each entry:
 *   { days: ['Monday', ...],          // required
 *     hours: '09:00-17:00',           // shorthand for same-hours
 *     custom: { Monday: '08:00-12:00', ... }  // per-day hours
 *   }
 * If `porters` is omitted, picks 1 porter with default Mon–Fri 9–5.
 *
 * Example:
 *   await pickPorterSchedule(page, {
 *     porters: [
 *       { days: ['Monday','Wednesday','Friday'], hours: '09:00-17:00' },
 *       { days: ['Tuesday','Thursday'], hours: '13:00-19:00' }
 *     ]
 *   });
 */
async function pickPorterSchedule(page, opts = {}) {
  const porters = (opts && opts.porters && opts.porters.length)
    ? opts.porters
    : [{ days: ['Monday','Tuesday','Wednesday','Thursday','Friday'], hours: '09:00-17:00' }];

  // Add porters via the "+ Add" button if more than the seeded one.
  for (let i = 1; i < porters.length; i++) {
    await page.click('#qfDpAddPorter');
    await page.waitForTimeout(150);
  }

  for (let idx = 0; idx < porters.length; idx++) {
    const p = porters[idx];
    // Open the porter card if not already open. Click its header.
    const card = page.locator(`#qfDpPorters .qf-dp-porter[data-porter-idx="${idx}"]`).first();
    if (!(await card.evaluate((el) => el.classList.contains('is-open')))) {
      await card.locator('.qf-dp-porter-header').click();
      await page.waitForTimeout(120);
    }
    // Clear default day selection by clicking the Clear preset.
    const clearBtn = card.locator('.qf-dp-preset', { hasText: 'Clear' }).first();
    if (await clearBtn.count()) await clearBtn.click();
    await page.waitForTimeout(80);
    // Pick each day.
    for (const day of p.days) {
      await card.locator(`.qf-day-card[data-day="${day}"]`).click();
      await page.waitForTimeout(40);
    }
    if (p.custom) {
      // Switch to "Per day" mode.
      await card.locator('.qf-dp-hours-mode-opt').nth(1).click();
      await page.waitForTimeout(80);
      for (const [day, range] of Object.entries(p.custom)) {
        const [start, end] = range.split('-');
        const row = card.locator('.qf-dp-custom-row').filter({ hasText: day }).first();
        await row.locator('input[type="time"]').nth(0).fill(start);
        await row.locator('input[type="time"]').nth(1).fill(end);
      }
    } else if (p.hours) {
      const [start, end] = p.hours.split('-');
      await card.locator(`#qf-dp-start-${idx + 1}`).fill(start);
      await card.locator(`#qf-dp-end-${idx + 1}`).fill(end);
    }
  }

  await page.click('#qfDpScheduleContinue');
}

module.exports = {
  freshOpen,
  dismissCookieBanner,
  expectActive,
  expectNoJsErrors,
  pickSpace,
  fillInfo,
  pickSize,
  pickSizeExact,
  pickSchedule,
  pickPorterSchedule,
  fillLocation,
};
