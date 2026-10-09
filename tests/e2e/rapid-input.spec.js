// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-08 — guards two rapid-input fixes (audit LOGA-1, LOGA-3): the second
 * half of a double click/tap must not land on the next screen's card, a queued
 * navigation must not replay once the screen moved on, and the 1-9 shortcuts
 * must ignore modifier keys and stay off while the "Welcome back" banner is up.
 */
test.describe('Rapid input', () => {
  // On iPhone 13 the janitorial card does not overlap any space card, so this one only bites on desktop.
  test('a double click on a service card does not pick a space on the next screen', async ({ page }) => {
    await h.freshOpen(page);
    await page.dblclick('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await page.waitForTimeout(700);
    await expect(page.locator('#qfScreen_space')).toHaveClass(/is-active/); // not size
    await expect(page.locator('#qfScreen_space .qf2-card.is-selected')).toHaveCount(0);
    h.expectNoJsErrors(page);
  });

  test('a double click on Continue does not press a chip on the next screen', async ({ page }) => {
    await h.freshOpen(page);
    await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await page.click('#qfScreen_days .qf-day-card[data-day="Monday"]');
    await page.click('#qfScreen_days .qf2-chip-time[data-time="morning"]');
    await page.dblclick('#qfDaysContinue');
    await h.expectActive(page, 'qfScreen_location');
    await page.waitForTimeout(700);
    await expect(page.locator('#qfScreen_location')).toHaveClass(/is-active/); // the queued goNext did not skip Location
    await expect(page.locator('#qfScreen_location .qf2-chip[aria-pressed="true"]')).toHaveCount(0);
    h.expectNoJsErrors(page);
  });

  test('digit shortcuts ignore modifier keys', async ({ page }) => {
    await h.freshOpen(page);
    for (const combo of ['Control+1', 'Alt+2', 'Meta+1']) {
      await page.keyboard.press(combo);
      await page.waitForTimeout(300);
      await expect(page.locator('#qfScreen_welcome'), combo).toHaveClass(/is-active/);
    }
    await page.keyboard.press('1');
    await h.expectActive(page, 'qfScreen_space');
  });

  test('digit shortcuts stay off while the Welcome back banner is up', async ({ page }) => {
    await h.freshOpen(page);
    await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    const draft = await page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'));
    expect(draft).toBeTruthy();
    await page.addInitScript((d) => { try { localStorage.setItem('ecco_quote_draft_v1', d); } catch (_) {} }, draft);
    await page.reload();
    await expect(page.locator('.qf-resume-banner')).toBeVisible();
    await page.keyboard.press('1');
    await page.waitForTimeout(400);
    await expect(page.locator('#qfScreen_welcome')).toHaveClass(/is-active/);
    await expect(page.locator('.qf-resume-banner')).toBeVisible(); // nothing discarded
    expect(await page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'))).toBeTruthy();
  });
});
