// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-19 — entry context (audit MOD-6, decided by Alex): a link from a
 * service page carries ?service=…; with nothing to resume the wizard opens on
 * the Space step with that service set, Back leads to Welcome, and the page
 * that sent the visitor travels in the lead source. Unknown values and a
 * resumable draft leave the normal Welcome untouched.
 */
const mockSubmit = async (page) => {
  const posts = [];
  await page.route('**/api/submit-quote', async (route) => {
    posts.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ref: 'ECJ-TEST123' }) });
  });
  return posts;
};

test.describe('Entry context (?service)', () => {
  test('?service=dayporter opens on Space with the Day Porter flow; Back returns to Welcome', async ({ page }) => {
    await h.freshOpen(page, '/quote.html?service=dayporter');
    await h.expectActive(page, 'qfScreen_space');
    await expect(page.locator('#qfScreen_space .qf2-flowbar-step-count')).toContainText(/of 6/);
    await page.locator('#qfScreen_space [data-qf2-back]:visible').first().click();
    await h.expectActive(page, 'qfScreen_welcome');
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_schedule'); // Day Porter flow, not janitorial
    h.expectNoJsErrors(page);
  });

  test('the service and the sending page reach the payload', async ({ page }) => {
    const origin = new URL(test.info().project.use.baseURL).origin;
    await h.freshOpen(page, '/quote.html?service=janitorial', { referer: origin + '/janitorial.html' });
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
    const posts = await mockSubmit(page);
    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await h.expectActive(page, 'qfScreen_success');
    expect(posts[0].formType).toBe('janitorial');
    expect(posts[0].source.landing).toBe('/quote.html?service=janitorial');
    expect(posts[0].source.prev_page).toBe('/janitorial.html');
    expect(posts[0].source).not.toHaveProperty('referrer');
    h.expectNoJsErrors(page);
  });

  test('arriving by link and leaving saves nothing: the next link still opens on Space', async ({ page }) => {
    await h.freshOpen(page, '/quote.html?service=dayporter');
    await h.expectActive(page, 'qfScreen_space');
    expect(await page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'))).toBeNull();
    // Second visit from the other service page, on a fresh page of the same context
    // (shares localStorage, carries no draft-wiping init script): no "Welcome back",
    // straight to Space again.
    const p2 = await page.context().newPage();
    await p2.goto('/quote.html?service=janitorial');
    await h.expectActive(p2, 'qfScreen_space');
    await expect(p2.locator('.qf-resume-banner')).toHaveCount(0);
    await h.pickSpace(p2, 'Office');
    await h.expectActive(p2, 'qfScreen_size'); // janitorial flow; the first answer now saves the draft
    expect(await p2.evaluate(() => JSON.parse(localStorage.getItem('ecco_quote_draft_v1') || '{}').s?.service)).toBe('janitorial');
    await p2.close();
    h.expectNoJsErrors(page);
  });

  test('an unknown ?service value leaves Welcome as it is', async ({ page }) => {
    await h.freshOpen(page, '/quote.html?service=bogus');
    await h.expectActive(page, 'qfScreen_welcome');
    await expect(page.locator('.qf2-card[data-service]')).toHaveCount(2);
    h.expectNoJsErrors(page);
  });

  test('a resumable draft wins over ?service: the banner shows and Welcome stays', async ({ page }) => {
    await h.freshOpen(page);
    await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    const draft = await page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'));
    expect(draft).toBeTruthy();
    await page.addInitScript((d) => { try { localStorage.setItem('ecco_quote_draft_v1', d); } catch (_) {} }, draft);
    await page.goto('/quote.html?service=dayporter');
    await expect(page.locator('.qf-resume-banner')).toBeVisible();
    await h.expectActive(page, 'qfScreen_welcome');
    await page.click('.qf-resume-resume');
    await h.expectActive(page, 'qfScreen_days'); // the janitorial draft, not a Day Porter restart
    h.expectNoJsErrors(page);
  });
});
