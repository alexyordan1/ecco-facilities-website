// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * Welcome screen E2E.
 *
 * NOTE 2026-06-26 — two tests were removed because the UI they exercised no
 * longer exists in production (verified against eccofacilities.com/quote.html):
 *   • "Alina hero pill expands on tap" — the .qf2-alina-hero pill was removed.
 *   • "Not sure quiz reveals chips" — the #qf2QuizToggle mini-quiz was removed.
 * They were testing dead markup, so they're dropped rather than rewritten.
 */

test.describe('Welcome screen', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('three service cards visible', async ({ page }) => {
    await expect(page.locator('.qf2-card[data-service="janitorial"]')).toBeVisible();
    await expect(page.locator('.qf2-card[data-service="dayporter"]')).toBeVisible();
    await expect(page.locator('.qf2-card[data-service="both"]')).toBeVisible();
  });

  test('keyboard shortcut: 1 picks first service (advances to Space)', async ({ page }) => {
    await page.keyboard.press('1');
    await h.expectActive(page, 'qfScreen_space');
    h.expectNoJsErrors(page);
  });

  test('F regression: in-session service switch clears the previous flow\'s answers', async ({ page }) => {
    // Adversarial sweep 2026-06-26, finding F (fixed 2026-07-17): switching
    // service mid-session used to carry janitorial answers (size, days,
    // timeOfDay) into the Day Porter payload — buildSubmitPayload ships
    // STATE.days as dpDays for 'dayporter', so stale cleaning days were
    // mislabeled as porter days. Walk janitorial as far as the days screen,
    // Esc back to Welcome, switch to Day Porter, finish that flow, and
    // assert the posted payload contains no janitorial leftovers.
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');
    await page.click('#qfScreen_days .qf-day-card[data-day="Monday"]');
    await page.click('#qfScreen_days .qf2-chip-time[data-time="morning"]');

    // Esc back to Welcome (days → size → space → welcome).
    await page.keyboard.press('Escape');
    await h.expectActive(page, 'qfScreen_size');
    await page.keyboard.press('Escape');
    await h.expectActive(page, 'qfScreen_space');
    await page.keyboard.press('Escape');
    await h.expectActive(page, 'qfScreen_welcome');

    // Switch service: Day Porter.
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_schedule');
    await page.click('#qfDpScheduleContinue');
    await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_contact');

    let postedPayload = null;
    await page.route('**/api/submit-quote', async (route) => {
      postedPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, ref: 'EDP-SWITCH-OK' }),
      });
    });

    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await page.waitForTimeout(2500);

    expect(postedPayload).not.toBeNull();
    expect(postedPayload.formType).toBe('dayporter');
    // Porter schedule comes from the schedule screen, not stale janitorial days.
    expect(postedPayload.dpPorters).toBeTruthy();
    expect(postedPayload.dpPorters.length).toBeGreaterThan(0);
    // Janitorial leftovers must NOT ship: Monday/morning + 1k-3k were cleared.
    // (null values are stripped from the wire payload, so a clean switch
    // means these keys are absent; the stale bug shipped real values.)
    expect(postedPayload.dpDays).toBeUndefined();
    expect(postedPayload.janDays).toBeUndefined();
    expect(postedPayload.timeOfDay).toBeUndefined();
    expect(postedPayload.size).toBeUndefined();

    h.expectNoJsErrors(page);
  });
});
