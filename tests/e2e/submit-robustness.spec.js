// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-08 — guards the submit pipeline fixes (audit LOGB-1, LOGB-2, LOGB-V1,
 * LOGB-7): while "Sending…" nothing steps away from the review or edits it, an
 * offline→online blip cannot re-enable Send mid-POST, success always lands on
 * the Success screen, a click before the Turnstile script arrives waits for it
 * instead of posting without a token, and an error re-enables everything.
 */
const walkToContact = async (page) => {
  await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
  await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
  await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
  await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
  await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
};
const mockSubmit = async (page, { delay = 0, status = 200, body = { ok: true, ref: 'ECJ-TEST123' } } = {}) => {
  const posts = [];
  await page.route('**/api/submit-quote', async (route) => {
    posts.push(JSON.parse(route.request().postData() || '{}'));
    if (delay) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return posts;
};
const clickSend = async (page) => {
  await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
  await page.click('#qfContactSubmit');
};

test.describe('Submit robustness', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
    await walkToContact(page);
  });

  test('Esc, Back and Edit are inert while sending; success lands on Success once', async ({ page }) => {
    const posts = await mockSubmit(page, { delay: 2500 });
    await clickSend(page);
    await expect(page.locator('#qfScreen_contact')).toHaveAttribute('aria-busy', 'true');
    await page.keyboard.press('Escape');
    await page.locator('#qfScreen_contact [data-qf2-back]:visible').first().click({ force: true });
    await page.locator('#qfScreen_contact .qf2-edit-btn[data-edit]').first().click({ force: true });
    await page.waitForTimeout(400);
    await expect(page.locator('#qfScreen_contact')).toHaveClass(/is-active/);
    await expect(page.locator('#qfScreen_contact .qf2-sum-edit-panel')).toHaveCount(0);
    await h.expectActive(page, 'qfScreen_success');
    await page.waitForTimeout(500);
    expect(posts.length).toBe(1);
    h.expectNoJsErrors(page);
  });

  test('an offline/online blip during the POST cannot re-enable Send', async ({ page }) => {
    const posts = await mockSubmit(page, { delay: 2500 });
    await clickSend(page);
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.dispatchEvent(new Event('offline')); window.dispatchEvent(new Event('online')); });
    await page.waitForTimeout(200);
    const btn = page.locator('#qfContactSubmit');
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveAttribute('aria-busy', 'true');
    await page.evaluate(() => { const b = document.getElementById('qfContactSubmit'); if (b) b.click(); }); // a disabled button ignores this
    await h.expectActive(page, 'qfScreen_success');
    await page.waitForTimeout(500);
    expect(posts.length).toBe(1);
  });

  test('a click before the Turnstile script lands waits for it instead of posting without a token', async ({ page }) => {
    const posts = await mockSubmit(page);
    await page.evaluate(() => { window.qfTurnstileState = 'loading'; }); // the suite blocks the real script
    await clickSend(page);
    await page.waitForTimeout(1200);
    expect(posts.length).toBe(0); // still waiting for the script
    await page.evaluate(() => {
      // @ts-ignore — a minimal stand-in for the Cloudflare widget
      window.turnstile = { reset() {}, execute() { window.qfTurnstileCallback('tok-123'); } };
    });
    await h.expectActive(page, 'qfScreen_success');
    expect(posts.length).toBe(1);
    expect(posts[0].turnstileToken).toBe('tok-123');
  });

  test('a server error re-enables Send, the review and Esc', async ({ page }) => {
    await mockSubmit(page, { status: 500, body: { ok: false } });
    await clickSend(page);
    await expect(page.locator('.qf-toast.is-visible')).toBeVisible();
    await expect(page.locator('#qfContactSubmit')).toBeEnabled();
    await expect(page.locator('#qfScreen_contact')).not.toHaveAttribute('aria-busy', 'true');
    await page.locator('#qfScreen_contact .qf2-edit-btn[data-edit]').first().click();
    await expect(page.locator('#qfScreen_contact .qf2-sum-edit-panel')).toHaveCount(1);
    await page.keyboard.press('Escape'); // closes the panel
    await page.keyboard.press('Escape'); // now steps back
    await h.expectActive(page, 'qfScreen_info');
  });
});
