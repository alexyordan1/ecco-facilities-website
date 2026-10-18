// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-18 — "More than one location?" chip on the Location step (audit
 * UX-13 / MOD-19, decided by Alex): optional single-select; the pick shows in
 * the review's extras row, ships as `locations`, survives a reload + Resume,
 * and the extras "Hop back" opens the business step when that is where the
 * shown picks live.
 */
const walkToLocation = async (page) => {
  await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
  await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
  await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
};
const finishToContact = async (page) => {
  await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
  await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
};
const mockSubmit = async (page) => {
  const posts = [];
  await page.route('**/api/submit-quote', async (route) => {
    posts.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ref: 'ECJ-TEST123' }) });
  });
  return posts;
};
const chip = (page, value) => page.locator(`#qfScreen_location .qf2-chip[data-locations="${value}"]`);
const extrasRow = (page) => page.locator('#qfScreen_contact .qf2-sum-row[data-section="extras"]');

test.describe('Number-of-locations chip', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
    await walkToLocation(page);
  });

  test('picking "2 to 5" shows in the review and ships as locations=2-5', async ({ page }) => {
    await chip(page, '2-5').click();
    await expect(chip(page, '2-5')).toHaveAttribute('aria-pressed', 'true');
    await expect(chip(page, 'one')).toHaveAttribute('aria-pressed', 'false');
    await finishToContact(page);
    await expect(extrasRow(page)).toBeVisible();
    expect(await h.readSummaryText(page)).toContain('2 to 5 locations');
    const posts = await mockSubmit(page);
    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await h.expectActive(page, 'qfScreen_success');
    expect(posts).toHaveLength(1);
    expect(posts[0].locations).toBe('2-5');
    h.expectNoJsErrors(page);
  });

  test('the chip is optional and re-clicking it clears the pick', async ({ page }) => {
    await chip(page, '6plus').click();
    await chip(page, '6plus').click();
    await expect(chip(page, '6plus')).toHaveAttribute('aria-pressed', 'false');
    await finishToContact(page);
    await expect(extrasRow(page)).toBeHidden();
    const posts = await mockSubmit(page);
    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await h.expectActive(page, 'qfScreen_success');
    expect(posts[0]).not.toHaveProperty('locations');
    h.expectNoJsErrors(page);
  });

  test('the pick survives a reload and Resume (timing chip too)', async ({ page }) => {
    await page.locator('#qfScreen_location .qf2-chip[data-timeline="asap"]').click();
    await chip(page, '6plus').click();
    // The chip click saves the draft synchronously; poll instead of sleeping.
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'))).toMatch(/"locations":"6plus"/);
    const draft = await page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'));
    await page.addInitScript((d) => { try { localStorage.setItem('ecco_quote_draft_v1', d); } catch (_) {} }, draft);
    await page.reload();
    await expect(page.locator('.qf-resume-banner')).toBeVisible();
    await page.click('.qf-resume-resume');
    await h.expectActive(page, 'qfScreen_location');
    await expect(chip(page, '6plus')).toHaveAttribute('aria-pressed', 'true');
    await expect(chip(page, '6plus')).toHaveClass(/is-selected/);
    await expect(page.locator('#qfScreen_location .qf2-chip[data-timeline="asap"]')).toHaveAttribute('aria-pressed', 'true');
    // Re-clicking the restored chip must clear it (it was "on"), not re-select it.
    await chip(page, '6plus').click();
    await expect(chip(page, '6plus')).toHaveAttribute('aria-pressed', 'false');
    h.expectNoJsErrors(page);
  });

  test('Edit on the extras row hops back to the business step when only timing/locations were picked', async ({ page }) => {
    await page.locator('#qfScreen_location .qf2-chip[data-timeline="weeks"]').click();
    await chip(page, '2-5').click();
    await finishToContact(page);
    await expect(extrasRow(page)).toBeVisible();
    expect(await h.readSummaryText(page)).toContain('In a few weeks · 2 to 5 locations');
    await page.locator('#qfScreen_contact .qf2-edit-btn[data-edit="extras"]').click();
    await expect(page.locator('#qfScreen_contact .qf2-edit-note')).toContainText('business step');
    await page.locator('#qfScreen_contact .qf2-sum-edit-save').click();
    await h.expectActive(page, 'qfScreen_location');
    await expect(chip(page, '2-5')).toHaveAttribute('aria-pressed', 'true');
    h.expectNoJsErrors(page);
  });
});
