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
 * Step 5 (SCHEDULE) — pick a single day chip then Continue. Evening default
 * already pre-selected.
 */
async function pickSchedule(page, day = 'Monday', time = null) {
  await page.click(`.qf-day-card[data-day="${day}"]`);
  if (time) await page.click(`.qf2-chip-time[data-time="${time}"]`);
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
  fillLocation,
};
