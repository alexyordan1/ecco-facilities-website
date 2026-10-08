// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-08 — guards the next-screen photo warm-up (js/quote-flow.js,
 * QF_SCREEN_PHOTOS + qfWarmNextPhotos). Three things the rest of the suite
 * cannot see: (1) the map only produces files that exist (a typo would 404
 * silently: expectNoJsErrors ignores "Failed to load resource"), (2) the
 * welcome warms Space before any click, (3) a resumable draft warms its own
 * saved step instead of Space. Runs on both projects, so the desktop and the
 * -800 phone variants are both exercised.
 */
function trackPhotos(page) {
  const seen = [];
  page.on('response', (r) => {
    if (r.url().includes('/images/stock/')) seen.push({ name: r.url().split('/stock/')[1], status: r.status() });
  });
  return seen;
}

const walkJanitorialToContact = async (page) => {
  await page.click('.qf2-card[data-service="janitorial"]');
  await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office');
  await h.expectActive(page, 'qfScreen_size');
  await h.pickSize(page, '1k-3k');
  await h.expectActive(page, 'qfScreen_days');
  await h.pickSchedule(page, 'Monday');
  await h.expectActive(page, 'qfScreen_location');
  await h.fillLocation(page);
  await h.expectActive(page, 'qfScreen_info');
  await h.fillInfo(page);
  await h.expectActive(page, 'qfScreen_contact');
};

test.describe('Photo warm-up', () => {
  test('welcome warms the Space photos before any click, all 200', async ({ page }) => {
    const seen = trackPhotos(page);
    await h.freshOpen(page);
    await page.waitForTimeout(2500);
    const names = seen.map((s) => s.name);
    expect(names.some((n) => n.startsWith('ecco-cc-hero-lobby'))).toBe(true);
    for (const card of ['corporate', 'medical', 'retail', 'restaurant', 'gym', 'school']) {
      expect(names).toContain(`ecco-v-${card}-800.webp`);
    }
    expect(seen.filter((s) => s.status !== 200)).toEqual([]);
  });

  test('every photo requested along the janitorial flow exists (200)', async ({ page }) => {
    const seen = trackPhotos(page);
    await h.freshOpen(page);
    await walkJanitorialToContact(page);
    await page.waitForTimeout(1500); // let the warm-up of the next screen (success) land too
    const distinct = new Set(seen.map((s) => s.name));
    // welcome + space (7) + size + days + location + info + contact + success
    expect(distinct.size).toBeGreaterThanOrEqual(13);
    expect(seen.filter((s) => s.status !== 200)).toEqual([]);
    h.expectNoJsErrors(page);
  });

  test('a resumable draft warms its own step, not Space', async ({ page }) => {
    await h.freshOpen(page);
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');
    const draft = await page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'));
    expect(draft).toBeTruthy();
    // freshOpen's init script wipes the draft on every navigation; put it back after that runs.
    await page.addInitScript((d) => { try { localStorage.setItem('ecco_quote_draft_v1', d); } catch (_) {} }, draft);
    const seen = trackPhotos(page);
    await page.reload();
    await expect(page.locator('.qf-resume-banner')).toBeVisible();
    await page.waitForTimeout(2500);
    const names = seen.map((s) => s.name);
    expect(names.some((n) => n.startsWith('ecco-clean-squeegee-bw'))).toBe(true); // the Days photo
    expect(names.some((n) => n.startsWith('ecco-v-'))).toBe(false); // Space cards not downloaded in vain
  });
});
