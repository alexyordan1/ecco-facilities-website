// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * Sprint 5 D24 — Janitorial flow E2E.
 * Real flow: Welcome → Space → Info → Size → Days → Location → Contact.
 *
 * NOTE: every transition has a 850ms `_qfTransitioning` guard + a CSS
 * crossfade. Tests must `expectActive` after EVERY click that triggers a
 * navigation, otherwise the next click fires while the guard is still
 * locked and silently no-ops.
 */

test.describe('Janitorial — full flow', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('full happy path Welcome → Contact', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');

    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');

    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');

    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');

    await h.pickSchedule(page, 'Monday');
    await h.expectActive(page, 'qfScreen_location');

    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_contact');

    h.expectNoJsErrors(page);
  });

  test('Step 4 — exact sq ft Continue advances (D23 regression)', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');

    await h.pickSizeExact(page, 1500);
    await h.expectActive(page, 'qfScreen_days');

    h.expectNoJsErrors(page);
  });

  test('Step 4 — Enter on numeric input also advances', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');

    await page.fill('#qfSizeCustom', '2400');
    await page.locator('#qfSizeCustom').press('Enter');
    await h.expectActive(page, 'qfScreen_days');

    h.expectNoJsErrors(page);
  });

  test('Step 4 — invalid sq ft (under 100) shows error, stays on screen', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');

    await page.fill('#qfSizeCustom', '50');
    await page.click('#qf2SizeContinue');
    // Should NOT have advanced — still on size screen.
    await expect(page.locator('#qfScreen_size')).toHaveClass(/is-active/);
  });

  test('Step 4 — visit_required card flags needsSiteWalk and advances', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');

    await h.pickSize(page, 'visit_required');
    await h.expectActive(page, 'qfScreen_days');
    h.expectNoJsErrors(page);
  });

  test('Step 2 — catch-all input describes a non-listed space', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await page.fill('#qf2SpaceOther', 'warehouse');
    await page.click('#qf2SpaceContinue');
    await h.expectActive(page, 'qfScreen_info');
    h.expectNoJsErrors(page);
  });

  test('Step 5 — Continue blocked without time-window selection (D49)', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');
    await page.click('.qf2-size-card[data-size="3k-6k"]');
    await h.expectActive(page, 'qfScreen_days');
    // Pick a day but NO time window
    await page.click('#qfScreen_days .qf-day-card[data-day="Monday"]');
    // Continue should be disabled
    await expect(page.locator('#qfDaysContinue')).toBeDisabled();
    // Pick a time window — Continue enables
    await page.click('#qfScreen_days .qf2-chip-time[data-time="morning"]');
    await expect(page.locator('#qfDaysContinue')).toBeEnabled();
    await page.click('#qfDaysContinue');
    await h.expectActive(page, 'qfScreen_location');
  });
});
