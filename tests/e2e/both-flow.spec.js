// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * D57 — Combined (Janitorial + Day Porter) flow E2E.
 * Real flow: Welcome → Space → Info → Size → Days (jan) → Schedule (DP) → Location → Contact → Success.
 *
 * This is the most complex flow — it exercises the merge of the cleaning
 * schedule (janDays + timeOfDay) and the porter schedule (dpPorters), then
 * confirms both serialize correctly into the snapshot + payload.
 */

test.describe('Combined — full flow', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('1 — Happy path: cleaning Mon-Fri morning + 1 porter Mon-Fri 8-4', async ({ page }) => {
    await page.click('.qf2-card[data-service="both"]');
    await h.expectActive(page, 'qfScreen_space');

    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');

    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');

    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');

    await h.pickSchedule(page, 'Monday', 'morning');
    await h.expectActive(page, 'qfScreen_schedule');

    // Porter card defaults to Mon-Fri 8-4 — just continue.
    await page.click('#qfDpScheduleContinue');
    await h.expectActive(page, 'qfScreen_location');

    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_contact');

    // Snapshot should show both: cleaning days + porter row(s).
    const whenRow = page.locator('#qf2SumWhen');
    await expect(whenRow).toContainText(/Cleaning/);
    await expect(whenRow).toContainText(/Porter/);

    h.expectNoJsErrors(page);
  });

  test('2 — Cleaning weekends + 2 porters with different days', async ({ page }) => {
    await page.click('.qf2-card[data-service="both"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Retail');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '6k-12k');
    await h.expectActive(page, 'qfScreen_days');

    // Pick Sat + Sun for cleaning + Anytime
    await page.click('#qfScreen_days .qf-day-card[data-day="Saturday"]');
    await page.click('#qfScreen_days .qf-day-card[data-day="Sunday"]');
    await page.click('#qfScreen_days .qf2-chip-time[data-time="flexible"]');
    await page.click('#qfDaysContinue');
    await h.expectActive(page, 'qfScreen_schedule');

    // 2 porters with custom schedules
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
    await expect(whenRow).toContainText(/Cleaning.*Weekends/);
    await expect(whenRow).toContainText(/Porter\s*1/);
    await expect(whenRow).toContainText(/Porter\s*2/);

    h.expectNoJsErrors(page);
  });

  test('3 — Snapshot Edit on When row routes to schedule (not days)', async ({ page }) => {
    await page.click('.qf2-card[data-service="both"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday', 'morning');
    await h.expectActive(page, 'qfScreen_schedule');
    await page.click('#qfDpScheduleContinue');
    await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_contact');

    // Click Edit on the When row → Hop back → should go to Schedule (not Days).
    await page.click('.qf2-sum-row[data-section="schedule"] .qf2-edit-btn[data-edit="days"]');
    await page.waitForTimeout(200);
    await page.click('.qf2-sum-edit-save');
    await h.expectActive(page, 'qfScreen_schedule');

    h.expectNoJsErrors(page);
  });
});
