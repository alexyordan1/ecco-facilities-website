// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-08 — guards the draft-persistence fixes (audit LOGA-8, LOGB-8, LOGA-9):
 * text typed without pressing Continue survives a reload, the exact sq ft comes
 * back into its input after Resume, review notes are part of the draft, and
 * "Saved" is not claimed when storage is blocked.
 */
const walkTo = async (page, step) => {
  await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
  if (step === 'size') return;
  await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
  if (step === 'days') return;
  await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
  if (step === 'location') return;
  await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
  if (step === 'info') return;
  await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
};
// Reload keeping the draft (freshOpen's init script wipes it on every navigation) and press Resume.
const reloadAndResume = async (page) => {
  await page.waitForTimeout(600); // let the debounced mirror write the draft
  const draft = await page.evaluate(() => localStorage.getItem('ecco_quote_draft_v1'));
  expect(draft).toBeTruthy();
  await page.addInitScript((d) => { try { localStorage.setItem('ecco_quote_draft_v1', d); } catch (_) {} }, draft);
  await page.reload();
  await expect(page.locator('.qf-resume-banner')).toBeVisible();
  await page.click('.qf-resume-resume');
};

test.describe('Draft persistence', () => {
  test('company and address typed without Continue survive a reload', async ({ page }) => {
    await h.freshOpen(page);
    await walkTo(page, 'location');
    await page.fill('#qfCompanyName', 'Acme Clinic');
    await page.fill('#qfAddress', '350 5th Ave, New York, NY 10118');
    await reloadAndResume(page);
    await h.expectActive(page, 'qfScreen_location');
    expect(await page.inputValue('#qfCompanyName')).toBe('Acme Clinic');
    expect(await page.inputValue('#qfAddress')).toBe('350 5th Ave, New York, NY 10118');
    h.expectNoJsErrors(page);
  });

  test('name and email typed without Continue survive a reload', async ({ page }) => {
    await h.freshOpen(page);
    await walkTo(page, 'info');
    await page.fill('#qfUserFirstName', 'Ana');
    await page.fill('#qfUserEmail', 'ana@example.com');
    await reloadAndResume(page);
    await h.expectActive(page, 'qfScreen_info');
    expect(await page.inputValue('#qfUserFirstName')).toBe('Ana');
    expect(await page.inputValue('#qfUserEmail')).toBe('ana@example.com');
  });

  test('the exact sq ft comes back into its input after Resume and Back', async ({ page }) => {
    await h.freshOpen(page);
    await walkTo(page, 'size');
    await h.pickSizeExact(page, 4500); await h.expectActive(page, 'qfScreen_days');
    await reloadAndResume(page);
    await h.expectActive(page, 'qfScreen_days');
    await page.keyboard.press('Escape'); await h.expectActive(page, 'qfScreen_size');
    expect(await page.inputValue('#qfSizeCustom')).toBe('4500');
    await page.click('#qf2SizeContinue'); await h.expectActive(page, 'qfScreen_days');
  });

  test('review notes are part of the draft', async ({ page }) => {
    await h.freshOpen(page);
    await walkTo(page, 'contact');
    await page.fill('#qfSpecialInstructions', 'Freight elevator closes at 6.');
    await reloadAndResume(page);
    await h.expectActive(page, 'qfScreen_contact');
    expect(await page.inputValue('#qfSpecialInstructions')).toBe('Freight elevator closes at 6.');
  });

  test('"Saved" is not claimed when storage is blocked', async ({ page }) => {
    await page.addInitScript(() => {
      // Only the draft write fails (quota), so the pre-seeded consent still keeps the banner away.
      const orig = Storage.prototype.setItem;
      try {
        Object.defineProperty(Storage.prototype, 'setItem', { value: function (k, v) {
          if (k === 'ecco_quote_draft_v1') throw new Error('QuotaExceededError');
          return orig.call(this, k, v);
        } });
      } catch (_) {}
    });
    await h.freshOpen(page);
    await walkTo(page, 'info');
    await page.fill('#qfUserFirstName', 'Ana');
    await page.locator('#qfScreen_info .qf2-flowbar-skip:visible').first().click();
    await page.waitForTimeout(300);
    const label = await page.locator('#qfScreen_info .qf2-flowbar-skip:visible').first().textContent();
    expect(label).not.toContain('Saved');
    await expect(page.locator('.qf-toast.is-visible')).toHaveCount(0);
  });
});
