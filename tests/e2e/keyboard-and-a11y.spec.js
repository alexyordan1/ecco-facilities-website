// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

test.describe('Keyboard nav', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('Esc returns to previous step', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await page.keyboard.press('Escape');
    await h.expectActive(page, 'qfScreen_welcome');
  });

  test('Enter on email field advances from Info to Size', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await page.fill('#qfUserFirstName', 'A');
    await page.fill('#qfUserLastName', 'B');
    await page.fill('#qfUserEmail', 'a@b.com');
    await page.locator('#qfUserEmail').press('Enter');
    await h.expectActive(page, 'qfScreen_size');
  });

  test('Arrow keys navigate between day chips', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');

    // Scope to active screen — V1 legacy day-card markup also exists for the
    // Day Porter sub-flow (qf-dp-day-card), so a top-level data-day selector
    // is ambiguous.
    await page.locator('#qfScreen_days .qf2-chip[data-day="Monday"]').focus();
    await page.keyboard.press('ArrowRight');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-day'));
    expect(focused).toBe('Tuesday');
  });

  test('Inactive screens have inert + aria-hidden once navigated', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    const welcome = page.locator('#qfScreen_welcome');
    await expect(welcome).toHaveAttribute('inert', '');
    await expect(welcome).toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('Email validation', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
  });

  test('Bad email shows inline error on blur', async ({ page }) => {
    await page.fill('#qfUserFirstName', 'Test');
    await page.fill('#qfUserLastName', 'User');
    await page.fill('#qfUserEmail', 'not-an-email');
    await page.locator('#qfUserEmail').blur();
    // D77 — error now lives in a per-field slot adjacent to the email input.
    await expect(page.locator('#qf2InfoErr_email')).toBeVisible();
  });

  test('Good email after bad clears error', async ({ page }) => {
    await page.fill('#qfUserEmail', 'bad');
    await page.locator('#qfUserEmail').blur();
    await expect(page.locator('#qf2InfoErr_email')).toBeVisible();
    await page.fill('#qfUserEmail', 'good@example.com');
    await page.locator('#qfUserEmail').blur();
    await expect(page.locator('#qf2InfoErr_email')).toBeHidden();
  });
});
