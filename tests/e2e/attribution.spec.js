// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-19 — first-touch attribution (audit MOD-7): an ad click that lands on
 * a marketing page keeps its utm/gclid and entry page through to the lead,
 * instead of losing them on the way to /quote.
 */
const mockSubmit = async (page) => {
  const posts = [];
  await page.route('**/api/submit-quote', async (route) => {
    posts.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ref: 'ECJ-TEST123' }) });
  });
  return posts;
};
const walkAndSend = async (page) => {
  await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
  await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
  await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
  await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
  await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
  const posts = await mockSubmit(page);
  await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
  await page.click('#qfContactSubmit');
  await h.expectActive(page, 'qfScreen_success');
  return posts;
};

test.describe('Lead attribution', () => {
  test('utm and gclid from the home page reach the lead, with the entry page', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('ecco_cookies', 'declined'); } catch (_) {} });
    await page.route('**/challenges.cloudflare.com/**', (r) => r.abort());
    await page.route('**/maps.googleapis.com/**', (r) => r.abort());
    await page.goto('/?utm_source=google&utm_campaign=fall&gclid=abc123');
    await page.goto('/quote.html'); // same tab: sessionStorage carries the first touch
    await page.waitForSelector('.qf-screen.is-active');
    const posts = await walkAndSend(page);
    expect(posts[0].source.utm_source).toBe('google');
    expect(posts[0].source.utm_campaign).toBe('fall');
    expect(posts[0].source.gclid).toBe('abc123');
    expect(posts[0].source.entry_page).toBe('/');
    expect(posts[0].source.landing).toBe('/quote.html');
  });

  test("a campaign on the quote URL is used whole: nothing is borrowed from the first touch", async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('ecco_cookies', 'declined'); } catch (_) {} });
    await page.route('**/challenges.cloudflare.com/**', (r) => r.abort());
    await page.route('**/maps.googleapis.com/**', (r) => r.abort());
    await page.goto('/?utm_source=google&utm_campaign=fall&gclid=X');
    await page.goto('/quote.html?utm_source=newsletter');
    await page.waitForSelector('.qf-screen.is-active');
    const posts = await walkAndSend(page);
    expect(posts[0].source.utm_source).toBe('newsletter');
    expect(posts[0].source).not.toHaveProperty('utm_campaign');
    expect(posts[0].source).not.toHaveProperty('gclid');
    expect(posts[0].source).not.toHaveProperty('entry_page');
  });

  test('an ad that lands on /quote keeps its click id after a detour to another page', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('ecco_cookies', 'declined'); } catch (_) {} });
    await page.route('**/challenges.cloudflare.com/**', (r) => r.abort());
    await page.route('**/maps.googleapis.com/**', (r) => r.abort());
    await page.goto('/quote.html?utm_source=google&gclid=abc');
    await page.waitForSelector('.qf-screen.is-active');
    await page.goto('/about.html');
    const origin = new URL(test.info().project.use.baseURL).origin;
    await page.goto('/quote.html', { referer: origin + '/about.html' }); // as if a link on About was clicked
    await page.waitForSelector('.qf-screen.is-active');
    const posts = await walkAndSend(page);
    expect(posts[0].source.gclid).toBe('abc');
    expect(posts[0].source.utm_source).toBe('google');
    expect(posts[0].source.entry_page).toBe('/quote.html');
    expect(posts[0].source.prev_page).toBe('/about.html');
  });
});
