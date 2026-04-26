// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

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

  test('Alina hero pill expands on tap', async ({ page }) => {
    const pill = page.locator('.qf2-alina-hero[role="button"]').first();
    const before = (await pill.locator('.qf2-alina-hero-text').textContent()) || '';
    await pill.click();
    await expect(pill).toHaveAttribute('aria-expanded', 'true');
    const after = (await pill.locator('.qf2-alina-hero-text').textContent()) || '';
    expect(after).not.toBe(before);
    expect(after).toContain('Janitorial');
  });

  test('Not sure quiz reveals chips and recommends', async ({ page }) => {
    await page.click('#qf2QuizToggle');
    await expect(page.locator('.qf2-quiz-chips')).toBeVisible();
    await page.click('.qf2-quiz-chip[data-quiz-pick="dayporter"]');
    await expect(page.locator('#qf2QuizResult')).toBeVisible();
  });
});
