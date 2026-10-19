// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-19 — porter schedule default (audit LOGA-11, decided by Alex): the
 * seeded Mon–Fri 8 AM–4 PM porter is a suggestion. Continue stays disabled
 * until the visitor keeps it (chip) or adjusts it, so sales never receives a
 * schedule nobody chose. Porter days picked by hand survive a switch to
 * Combined instead of being overwritten by the cleaning days.
 */
const cont = (page) => page.locator('#qfDpScheduleContinue');
const chip = (page) => page.locator('#qfDpConfirm');
const status = (page) => page.locator('#qfDpStatus');
const back = (page, screen) => page.locator(`#${screen} [data-qf2-back]:visible`).first().click();
const openPorter = async (page, idx = 0) => {
  const card = page.locator(`#qfDpPorters .qf-dp-porter[data-porter-idx="${idx}"]`).first();
  if (!(await card.evaluate((el) => el.classList.contains('is-open')))) {
    await card.locator('.qf-dp-porter-header').click();
  }
  return card;
};
const toDayPorterSchedule = async (page) => {
  await page.click('.qf2-card[data-service="dayporter"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_schedule');
};

test.describe('Porter schedule: suggestion until kept or adjusted', () => {
  test.beforeEach(async ({ page }) => { await h.freshOpen(page); });

  test('the untouched default does not continue; keeping it does, and focus lands on Continue', async ({ page }) => {
    await toDayPorterSchedule(page);
    await expect(cont(page)).toBeDisabled();
    await expect(chip(page)).toBeVisible();
    await expect(chip(page)).toHaveText('Keep Mon–Fri · 8 AM–4 PM');
    await expect(status(page)).toHaveText('Keep the suggested schedule or adjust it to continue.');
    const box = await chip(page).boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
    await chip(page).click();
    await expect(cont(page)).toBeEnabled();
    await expect(cont(page)).toBeFocused();
    await expect(page.locator('#qfDpConfirmRow')).toBeHidden();
    await expect(status(page)).toHaveText('Looks good · 1 porter, 40 hours per week');
    const kept = await page.evaluate(() => (window.dataLayer || []).filter((e) => e && e.event === 'quote_porter_default_kept').length);
    expect(kept).toBe(1);
    await cont(page).click();
    await h.expectActive(page, 'qfScreen_location');
    h.expectNoJsErrors(page);
  });

  test('adjusting the schedule enables Continue without the chip', async ({ page }) => {
    await toDayPorterSchedule(page);
    const card = await openPorter(page);
    await card.locator('.qf-day-card[data-day="Friday"]').click();
    await expect(cont(page)).toBeEnabled();
    await expect(page.locator('#qfDpConfirmRow')).toBeHidden();
    await expect(status(page)).toHaveText('Looks good · 1 porter, 32 hours per week');
    h.expectNoJsErrors(page);
  });

  test('the choice survives a reload and Resume', async ({ page }) => {
    await toDayPorterSchedule(page);
    await chip(page).click();
    await expect(cont(page)).toBeEnabled();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'))).toMatch(/"dpScheduleConfirmed":true/);
    const draft = await page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'));
    const p2 = await page.context().newPage();
    await p2.addInitScript((d) => { try { localStorage.setItem('ecco_quote_draft_v1', d); } catch (_) {} }, draft);
    await p2.goto('/quote.html');
    await expect(p2.locator('.qf-resume-banner')).toBeVisible();
    await p2.click('.qf-resume-resume');
    await h.expectActive(p2, 'qfScreen_schedule');
    await expect(p2.locator('#qfDpScheduleContinue')).toBeEnabled();
    await expect(p2.locator('#qfDpConfirmRow')).toBeHidden();
    await p2.close();
  });

  test('porter days picked in Day Porter survive a switch to Combined', async ({ page }) => {
    await toDayPorterSchedule(page);
    await h.pickPorterSchedule(page, { porters: [{ days: ['Saturday', 'Sunday'], hours: '10:00-18:00' }] });
    await h.expectActive(page, 'qfScreen_location');
    await back(page, 'qfScreen_location'); await h.expectActive(page, 'qfScreen_schedule');
    await back(page, 'qfScreen_schedule'); await h.expectActive(page, 'qfScreen_space');
    await back(page, 'qfScreen_space'); await h.expectActive(page, 'qfScreen_welcome');
    await page.click('[data-service="both"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday', 'morning'); await h.expectActive(page, 'qfScreen_schedule');
    // Card stays open from the earlier edit; its summary line reads the schedule back.
    await expect(page.locator('#qfDpPorters')).toContainText('Porter 1 works Weekends, 10 AM to 6 PM');
    await expect(cont(page)).toBeEnabled(); // the visitor already chose this schedule
    h.expectNoJsErrors(page);
  });

  test('double-clicking the chip keeps one porter and moves on', async ({ page }) => {
    await toDayPorterSchedule(page);
    await chip(page).dblclick();
    await expect(page.locator('#qfDpPorters .qf-dp-porter')).toHaveCount(1);
    h.expectNoJsErrors(page);
  });

  test('Every day reads in sentence case on the chip', async ({ page }) => {
    await page.click('[data-service="both"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    for (const d of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
      await page.click(`#qfScreen_days .qf-day-card[data-day="${d}"]`);
    }
    await page.click('#qfScreen_days .qf2-chip-time[data-time="morning"]');
    await page.click('#qfDaysContinue'); await h.expectActive(page, 'qfScreen_schedule');
    await expect(chip(page)).toHaveText('Keep every day · 8 AM–4 PM');
    h.expectNoJsErrors(page);
  });

  test('a legacy draft past the schedule step counts as kept', async ({ page }) => {
    await toDayPorterSchedule(page);
    await h.keepPorterSchedule(page); await h.expectActive(page, 'qfScreen_location');
    // Simulate a draft saved before 2026-10-19: no dpScheduleConfirmed key.
    const legacy = await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('ecco_quote_draft_v1'));
      delete d.s.dpScheduleConfirmed;
      return JSON.stringify(d);
    });
    const p2 = await page.context().newPage();
    await p2.addInitScript((d) => { try { localStorage.setItem('ecco_quote_draft_v1', d); } catch (_) {} }, legacy);
    await p2.goto('/quote.html');
    await p2.click('.qf-resume-resume');
    await h.expectActive(p2, 'qfScreen_location');
    await p2.locator('#qfScreen_location [data-qf2-back]:visible').first().click();
    await h.expectActive(p2, 'qfScreen_schedule');
    await expect(p2.locator('#qfDpScheduleContinue')).toBeEnabled();
    await expect(p2.locator('#qfDpConfirmRow')).toBeHidden();
    await p2.close();
  });

  test('Combined: editing cleaning days from the review routes through the porter screen when its days move', async ({ page }) => {
    await page.click('[data-service="both"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday', 'morning'); await h.expectActive(page, 'qfScreen_schedule');
    await h.keepPorterSchedule(page); await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
    await page.locator('#qfScreen_contact .qf2-edit-btn[data-edit="days"]').click();
    await page.locator('#qfScreen_contact .qf2-sum-edit-save').click();
    await h.expectActive(page, 'qfScreen_days');
    await page.click('#qfScreen_days .qf-day-card[data-day="Wednesday"]');
    await page.click('#qfDaysContinue');
    await h.expectActive(page, 'qfScreen_schedule'); // not straight back to the review
    await expect(chip(page)).toHaveText('Keep Mon, Wed · 8 AM–4 PM');
    await h.keepPorterSchedule(page);
    await h.expectActive(page, 'qfScreen_contact'); // and then back to the review
    h.expectNoJsErrors(page);
  });

  test('Combined: an untouched porter follows the cleaning days and asks again when they change', async ({ page }) => {
    await page.click('[data-service="both"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday', 'morning'); await h.expectActive(page, 'qfScreen_schedule');
    await expect(chip(page)).toHaveText('Keep Mon · 8 AM–4 PM');
    await h.keepPorterSchedule(page); await h.expectActive(page, 'qfScreen_location');
    await back(page, 'qfScreen_location'); await h.expectActive(page, 'qfScreen_schedule');
    await back(page, 'qfScreen_schedule'); await h.expectActive(page, 'qfScreen_days');
    await page.click('#qfScreen_days .qf-day-card[data-day="Wednesday"]');
    await page.click('#qfDaysContinue'); await h.expectActive(page, 'qfScreen_schedule');
    await expect(chip(page)).toHaveText('Keep Mon, Wed · 8 AM–4 PM');
    await expect(cont(page)).toBeDisabled();
    h.expectNoJsErrors(page);
  });
});
