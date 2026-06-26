// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * Welcome screen E2E.
 *
 * NOTE 2026-06-26 — two tests were removed because the UI they exercised no
 * longer exists in production (verified against eccofacilities.com/quote.html):
 *   • "Alina hero pill expands on tap" — the .qf2-alina-hero pill was removed.
 *   • "Not sure quiz reveals chips" — the #qf2QuizToggle mini-quiz was removed.
 * They were testing dead markup, so they're dropped rather than rewritten.
 */

test.describe('Welcome screen', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('three service cards visible', async ({ page }) => {
    await expect(page.locator('.qf2-card[data-service="janitorial"]')).toBeVisible();
    await expect(page.locator('.qf2-card[data-service="dayporter"]')).toBeVisible();
    await expect(page.locator('.qf2-card[data-service="both"]')).toBeVisible();
  });

  test('keyboard shortcut: 1 picks first service (advances to Space)', async ({ page }) => {
    await page.keyboard.press('1');
    await h.expectActive(page, 'qfScreen_space');
    h.expectNoJsErrors(page);
  });
});
