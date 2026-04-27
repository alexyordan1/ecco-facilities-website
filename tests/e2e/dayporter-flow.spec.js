// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * D55 — Day Porter flow E2E.
 * Real flow: Welcome → Space → Info → Schedule → Location → Contact → Success.
 *
 * Schedule screen handles 1–6 porters, each with their own days and either
 * "Same hours" (single start/end) or "Per day" (per-day start/end).
 *
 * NOTE: every transition has a 850ms `_qfTransitioning` guard + a CSS
 * crossfade. Tests must `expectActive` after EVERY click that triggers a
 * navigation, otherwise the next click fires while the guard is still
 * locked and silently no-ops.
 */

test.describe('Day Porter — full flow', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('1 — Happy path: Welcome → Schedule → Snapshot with 1 porter', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');

    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');

    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');

    // Schedule defaults: 1 porter, Mon–Fri 9–5 (Office defaults).
    // Just click Continue and verify advance.
    await page.click('#qfDpScheduleContinue');
    await h.expectActive(page, 'qfScreen_location');

    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_contact');

    // Snapshot should show porter info.
    const whenRow = page.locator('#qf2SumWhen');
    await expect(whenRow).toContainText(/Porter\s*1/);
    await expect(whenRow).toContainText(/Weekdays/);

    h.expectNoJsErrors(page);
  });

  test('2 — Multi-porter: 2 porters with different days', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');

    await h.pickPorterSchedule(page, {
      porters: [
        { days: ['Monday','Wednesday','Friday'], hours: '09:00-17:00' },
        { days: ['Tuesday','Thursday'], hours: '13:00-19:00' },
      ],
    });
    await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_contact');

    const whenRow = page.locator('#qf2SumWhen');
    await expect(whenRow).toContainText(/Porter\s*1/);
    await expect(whenRow).toContainText(/Porter\s*2/);

    h.expectNoJsErrors(page);
  });

  test('3 — Custom hours per day on a single porter', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');

    await h.pickPorterSchedule(page, {
      porters: [{
        days: ['Monday','Wednesday','Friday'],
        custom: {
          Monday:    '08:00-12:00',
          Wednesday: '13:00-17:00',
          Friday:    '09:00-13:00',
        },
      }],
    });
    await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_contact');

    const whenRow = page.locator('#qf2SumWhen');
    await expect(whenRow).toContainText(/\(custom\)/);

    h.expectNoJsErrors(page);
  });

  test('4 — Validation: Continue blocked when porter has no days', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');

    // Open the porter card, then click "Clear" preset.
    const card = page.locator('#qfDpPorters .qf-dp-porter[data-porter-idx="0"]').first();
    if (!(await card.evaluate((el) => el.classList.contains('is-open')))) {
      await card.locator('.qf-dp-porter-header').click();
    }
    await card.locator('.qf-dp-preset', { hasText: 'Clear' }).first().click();
    await page.waitForTimeout(120);

    // Continue should be disabled
    const cont = page.locator('#qfDpScheduleContinue');
    await expect(cont).toBeDisabled();

    h.expectNoJsErrors(page);
  });

  test('5 — Validation: end <= start blocks Continue', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');

    // Open card and set end <= start.
    const card = page.locator('#qfDpPorters .qf-dp-porter[data-porter-idx="0"]').first();
    if (!(await card.evaluate((el) => el.classList.contains('is-open')))) {
      await card.locator('.qf-dp-porter-header').click();
    }
    await card.locator('#qf-dp-start-1').fill('17:00');
    await card.locator('#qf-dp-end-1').fill('09:00');
    await page.waitForTimeout(150);

    const cont = page.locator('#qfDpScheduleContinue');
    await expect(cont).toBeDisabled();

    h.expectNoJsErrors(page);
  });

  test('6 — Telemetry: dataLayer contains quote_porter_added on + button click', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');

    // Click the "+ Add another porter" button.
    await page.click('#qfDpAddPorter');
    await page.waitForTimeout(200);

    const events = await page.evaluate(() =>
      (window.dataLayer || [])
        .filter((e) => e && e.event === 'quote_porter_added')
        .map((e) => ({ count: e.count }))
    );
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].count).toBe(2);

    h.expectNoJsErrors(page);
  });

  test('7 — D61 regression: Day Porter submit does NOT fail validation on STATE.days', async ({ page }) => {
    // Pre-D61, validateForSubmit() required STATE.days for every flow,
    // but pure Day Porter never visits qfScreen_days, so submit always
    // showed "Please pick at least one service day." This test guards
    // the fix: stub the submit network call, click submit, assert that
    // (a) the form posts to /api/submit-quote (validation passed) and
    // (b) no validation toast for missing days appears.
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');
    await page.click('#qfDpScheduleContinue');
    await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_contact');

    // Stub the submit endpoint so we don't actually submit a real lead.
    let postedPayload = null;
    await page.route('**/api/submit-quote', async (route) => {
      postedPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, ref: 'EDP-TEST123' }),
      });
    });

    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await page.waitForTimeout(2500);

    // Validation passed → request was POSTed.
    expect(postedPayload).not.toBeNull();
    expect(postedPayload.formType).toBe('dayporter');
    expect(postedPayload.dpPorters).toBeTruthy();
    expect(postedPayload.dpPorters.length).toBeGreaterThan(0);
    // No "service day" validation toast leaked through.
    const toasts = await page.locator('.qf-toast-body').allTextContents();
    const dayValidationToast = toasts.find((t) => /service day/i.test(t));
    expect(dayValidationToast).toBeUndefined();
  });
});
