// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-08 — guards three Info/Contact fixes (audit LOGA-6, LOGA-7, LOGA-12):
 * an email with a typo must not trap the focus on blur (Continue still blocks
 * and then moves the focus to the field), phone extensions and international
 * numbers survive the progressive formatter and reach the payload intact, and
 * the last name is optional in the markup as it is in the validation.
 */
const walkToInfo = async (page) => {
  await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
  await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
  await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
  await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
};
const activeId = (page) => page.evaluate(() => document.activeElement && document.activeElement.id);

test.describe('Info step', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
    await walkToInfo(page);
  });

  test('an email typo shows the hint without trapping the focus', async ({ page }) => {
    await page.fill('#qfUserFirstName', 'Ana');
    await page.fill('#qfUserEmail', 'ana@gmail.con');
    await page.keyboard.press('Tab');
    await expect(page.locator('#qf2InfoErr_email')).toBeVisible();
    await expect(page.locator('#qf2InfoErr_email')).toContainText('Did you mean');
    expect(await activeId(page)).not.toBe('qfUserEmail'); // the focus moved on
    await page.keyboard.type('Owner');
    expect(await page.inputValue('#qfUserEmail')).toBe('ana@gmail.con'); // nothing glued to the email
    await page.click('#qfInfoContinue');
    await h.expectActive(page, 'qfScreen_info'); // still blocked by the typo
    expect(await activeId(page)).toBe('qfUserEmail'); // and Continue sends the focus to the field to fix
    h.expectNoJsErrors(page);
  });

  test('last name is optional in the markup as it is in the validation', async ({ page }) => {
    const last = page.locator('#qfUserLastName');
    await expect(last).not.toHaveAttribute('required', /.*/);
    await expect(last).toHaveAttribute('aria-label', /optional/i);
    await page.fill('#qfUserFirstName', 'Ana');
    await page.fill('#qfUserEmail', 'ana@example.com');
    await page.click('#qfInfoContinue');
    await h.expectActive(page, 'qfScreen_contact');
  });

  test('phone keeps extensions and international numbers intact up to the payload', async ({ page }) => {
    await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
    await page.click('#qf2PhoneOptinToggle');
    const phone = page.locator('#qfUserPhone');
    await phone.click();
    await phone.pressSequentially('+1 (929) 280-9374 x12', { delay: 15 });
    expect(await phone.inputValue()).toBe('(929) 280-9374 x12');
    await phone.fill('');
    await phone.pressSequentially('+44 20 7946 0958', { delay: 15 });
    expect(await phone.inputValue()).toBe('+44 20 7946 0958');
    // glued digits with no extension marker are refused instead of sent
    await phone.fill('');
    await phone.pressSequentially('929-280-937412', { delay: 15 });
    await phone.blur();
    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await expect(page.locator('.qf-toast.is-visible')).toContainText('Phone looks off');
    await h.expectActive(page, 'qfScreen_contact');
    // the extension form is accepted and reaches the payload as typed
    await phone.fill('');
    await phone.pressSequentially('929-280-9374 x12', { delay: 15 });
    await phone.blur();
    let posted = null;
    await page.route('**/api/submit-quote', async (route) => {
      posted = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ref: 'ECJ-TEST123' }) });
    });
    await page.click('#qfContactSubmit');
    await page.waitForTimeout(2500);
    expect(posted).not.toBeNull();
    expect(posted.ph).toBe('(929) 280-9374 x12');
    h.expectNoJsErrors(page);
  });
});
