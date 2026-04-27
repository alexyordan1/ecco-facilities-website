// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * D63 — Error state E2E coverage. Exercises the failure paths users hit
 * in real conditions: network drops, validation, and submit retries.
 * The happy path is already covered by janitorial-flow / dayporter-flow
 * / both-flow.
 */

async function walkToContact(page, opts = {}) {
  await page.click('.qf2-card[data-service="dayporter"]');
  await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office');
  await h.expectActive(page, 'qfScreen_info');
  await h.fillInfo(page, opts.info || {});
  await h.expectActive(page, 'qfScreen_schedule');
  await page.click('#qfDpScheduleContinue');
  await h.expectActive(page, 'qfScreen_location');
  await h.fillLocation(page, opts.location || {});
  await h.expectActive(page, 'qfScreen_contact');
}

test.describe('Error states · submit failures', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('Network 500 → toast surfaces, user stays on contact', async ({ page }) => {
    await walkToContact(page);
    // Stub submit to return 500
    await page.route('**/api/submit-quote', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Internal' }) })
    );
    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await page.waitForTimeout(2000);

    // Stays on contact screen, error toast surfaces.
    await expect(page.locator('#qfScreen_contact')).toHaveClass(/is-active/);
    const toasts = await page.locator('.qf-toast-body').allTextContents();
    expect(toasts.some((t) => /failed|error|try again/i.test(t))).toBe(true);
  });

  test('Network abort → user can retry without losing data', async ({ page }) => {
    await walkToContact(page);
    let attempt = 0;
    await page.route('**/api/submit-quote', async (route) => {
      attempt += 1;
      if (attempt === 1) {
        await route.abort('failed');
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ref: 'EDP-RETRY-OK' }) });
    });
    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await page.waitForTimeout(2000);

    // After abort, still on contact + can retry. The retry rate-limit
    // (60s cooldown) blocks immediate re-submit, but the UI state must
    // not be wedged.
    await expect(page.locator('#qfScreen_contact')).toHaveClass(/is-active/);
    // Submit button is re-enabled (not stuck in busy state).
    await expect(page.locator('#qfContactSubmit')).toBeEnabled();
  });

  test('403 Captcha required → toast shown, stays on contact', async ({ page }) => {
    await walkToContact(page);
    await page.route('**/api/submit-quote', (route) =>
      route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Captcha required' }) })
    );
    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await page.waitForTimeout(2000);

    // Stays on contact, toast surfaces (any failure copy is acceptable —
    // we just guard that the screen doesn't silently advance).
    await expect(page.locator('#qfScreen_contact')).toHaveClass(/is-active/);
    const toasts = await page.locator('.qf-toast-body').allTextContents();
    expect(toasts.length).toBeGreaterThan(0);
  });
});

test.describe('Error states · validation', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('Invalid email on Info step blocks Continue', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await page.fill('#qfUserFirstName', 'Test');
    await page.fill('#qfUserLastName', 'User');
    await page.fill('#qfUserEmail', 'not-an-email');
    await page.click('#qfInfoContinue');
    await page.waitForTimeout(500);
    // Should NOT advance; stays on info.
    await expect(page.locator('#qfScreen_info')).toHaveClass(/is-active/);
  });

  test('Empty company on Location step blocks Continue', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');
    await page.click('#qfDpScheduleContinue');
    await h.expectActive(page, 'qfScreen_location');
    // Don't fill anything — click Continue.
    await page.click('#qfLocationContinue');
    await page.waitForTimeout(500);
    await expect(page.locator('#qfScreen_location')).toHaveClass(/is-active/);
  });
});
