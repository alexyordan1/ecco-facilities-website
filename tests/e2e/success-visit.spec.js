// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-19 — Success screen after the visit-promise fix (audit UX-12 / MOD-8,
 * decided by Alex): no email ever carried a "link to pick a time for your visit",
 * so the screen no longer promises one. The call button is the next step for
 * everyone; for a visit lead it reads as the way to schedule the visit.
 */
const walkToContact = async (page, size) => {
  await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
  await h.pickSize(page, size); await h.expectActive(page, 'qfScreen_days');
  await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
  await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
  await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
};
const submitOk = async (page) => {
  const posts = [];
  await page.route('**/api/submit-quote', async (route) => {
    posts.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ref: 'ECJ-TEST123' }) });
  });
  await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
  await page.click('#qfContactSubmit');
  await h.expectActive(page, 'qfScreen_success');
  return posts;
};
const bookingUrl = (page) => page.evaluate(() => window.QF_BOOKING_URL);

test.describe('Success screen: call as the door to the visit', () => {
  test.beforeEach(async ({ page }) => { await h.freshOpen(page); });

  test('a visit lead is told to book a call to schedule the visit, never promised a link', async ({ page }) => {
    await walkToContact(page, '12k-plus');
    await expect(page.locator('#qfContactSubmit')).toContainText('book visit');
    const posts = await submitOk(page);
    expect(posts[0].needsSiteWalk).toBe(true);
    const success = page.locator('#qfScreen_success');
    await expect(success.locator('.qf2-success-extra')).toContainText('Book a call below');
    await expect(success).not.toContainText(/link to pick a time|Pick a time from the link/);
    const second = success.locator('.qf2-timeline-item').nth(1);
    await expect(second.locator('.qf2-timeline-when')).toHaveText('After your visit');
    await expect(second.locator('.qf2-timeline-what')).toContainText('proposal');
    const third = success.locator('.qf2-timeline-item').nth(2);
    await expect(third).toHaveClass(/is-walk/);
    await expect(third.locator('.qf2-timeline-when')).toHaveText('Site visit');
    await expect(third.locator('.qf2-timeline-what')).toContainText('on your call');
    const cta = success.locator('#qfBookCta');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Book a call to schedule your visit');
    expect(await cta.getAttribute('href')).toBe(await bookingUrl(page));
    expect(await cta.getAttribute('target')).toBe('_blank');
    h.expectNoJsErrors(page);
  });

  test('a regular lead keeps the optional call wording and the 30-minute call button', async ({ page }) => {
    await walkToContact(page, '1k-3k');
    const posts = await submitOk(page);
    expect(posts[0]).not.toHaveProperty('needsSiteWalk');
    const success = page.locator('#qfScreen_success');
    await expect(success.locator('.qf2-success-extra')).toHaveCount(0);
    await expect(success.locator('.qf2-timeline-item').nth(1)).toContainText(/Within one business day|1 business day/);
    const third = success.locator('.qf2-timeline-item').nth(2);
    await expect(third).not.toHaveClass(/is-walk/);
    await expect(third.locator('.qf2-timeline-when')).toHaveText('Next');
    await expect(third).toContainText(/only if you want one|optional/);
    const cta = success.locator('#qfBookCta');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Book a 30-minute call with Alex');
    expect(await cta.getAttribute('href')).toBe(await bookingUrl(page));
    h.expectNoJsErrors(page);
  });
});
