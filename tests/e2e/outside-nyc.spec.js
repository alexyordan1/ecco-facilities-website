// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-08 — guards the "outside NYC" check (audit MOD-2 / LOGA-5 / LOGB-5 /
 * UX-2 / UX-V1): real NYC addresses must never trigger it (ZIP, no-ZIP text and
 * picked Google suggestions), the notice must be a real component (labelled
 * group, announced through #qfStepAnnouncer, 44px buttons, focus kept), an
 * answer must not be nagged again, and a corrected address must clear a stale
 * answer from the payload.
 */
const walkToLocation = async (page) => {
  await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
  await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
  await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
};
const typeAddress = async (page, addr) => {
  await page.fill('#qfAddress', addr);
  await page.locator('#qfSuite').focus(); // blur the address field, like tabbing on
  await page.waitForTimeout(250);
};
// Simulates picking a Google suggestion: the Places init in quote.html dispatches qf:place.
const pickSuggestion = async (page, addr, meta) => {
  await page.evaluate(({ addr, meta }) => {
    const a = /** @type {HTMLInputElement} */ (document.getElementById('qfAddress'));
    a.focus();
    a.value = addr;
    a.dispatchEvent(new Event('input', { bubbles: true }));
    a.dispatchEvent(new CustomEvent('qf:place', { detail: meta }));
    a.blur();
  }, { addr, meta });
  await page.waitForTimeout(250);
};
const bubble = (page) => page.locator('#qfScreen_location .qf2-out-of-area');
const announcer = (page) => page.locator('#qfStepAnnouncer');

test.describe('Outside-NYC check', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
    await walkToLocation(page);
  });

  test('real NYC addresses are never flagged (ZIP, no ZIP, picked suggestion)', async ({ page }) => {
    const nyc = [
      '1 Pennsylvania Plaza, New York, NY 10119',
      '55 Nassau St, New York, NY 10038',
      '27-01 Queens Plaza N, Long Island City, NY 11101',
      '92-11 Rockaway Beach Blvd, Queens, NY 11693',
      '15 Hanover Ct, Brooklyn, NY 11201',
      '120 Suffolk St, New York, NY 10002',
      '13347 Sanford Ave, Flushing, NY 11355', // house number is also 5 digits
      '1 Pennsylvania Plaza, New York', // no ZIP: left alone
      'Lex & 42nd',
    ];
    for (const addr of nyc) {
      await typeAddress(page, addr);
      await expect(bubble(page), addr).toHaveCount(0);
    }
    await pickSuggestion(page, '15 Hanover Ct, Brooklyn', { state: 'NY', county: '', borough: 'Brooklyn', zip: '' });
    await expect(bubble(page), 'picked Brooklyn').toHaveCount(0);
    h.expectNoJsErrors(page);
  });

  test('a New Jersey or Nassau County address shows a styled, announced notice once', async ({ page }) => {
    await typeAddress(page, '30 Hudson St, Jersey City, NJ 07302');
    await expect(bubble(page)).toBeVisible();
    await expect(bubble(page)).toHaveAttribute('role', 'group');
    await expect(announcer(page)).toContainText('outside NYC');
    for (const btn of await bubble(page).locator('button').all()) {
      const box = await btn.boundingBox();
      expect(box && box.height).toBeGreaterThanOrEqual(44);
    }
    await bubble(page).getByRole('button', { name: 'Yes, waitlist me' }).click();
    await expect(bubble(page)).toHaveCount(0);
    await expect(announcer(page)).toContainText('Added to the waitlist');
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('qfLocationContinue');
    await page.locator('#qfAddress').focus();
    await page.locator('#qfSuite').focus();
    await page.waitForTimeout(250);
    await expect(bubble(page)).toHaveCount(0); // answered: no nagging on the next blur
    await typeAddress(page, '1 Hillside Ave, Floral Park, NY 11001');
    await expect(bubble(page)).toBeVisible(); // new address, new question
    await typeAddress(page, 'Hoboken, NJ'); // no ZIP but an explicit state
    await expect(bubble(page)).toBeVisible();
    await pickSuggestion(page, '1 Hillside Ave, Floral Park', { state: 'NY', county: 'Nassau County', borough: '', zip: '' });
    await expect(bubble(page), 'picked Nassau County').toBeVisible();
    h.expectNoJsErrors(page);
  });

  test('correcting to a NYC address clears the stale answer from the payload', async ({ page }) => {
    await typeAddress(page, '30 Hudson St, Jersey City, NJ 07302');
    await bubble(page).getByRole('button', { name: 'Yes, waitlist me' }).click();
    await typeAddress(page, '350 5th Ave, New York, NY 10118');
    await expect(bubble(page)).toHaveCount(0);
    await page.fill('#qfCompanyName', 'Test Co');
    await page.click('#qfLocationContinue'); await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
    let posted = null;
    await page.route('**/api/submit-quote', async (route) => {
      posted = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ref: 'ECJ-TEST123' }) });
    });
    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await page.waitForTimeout(2500);
    expect(posted).not.toBeNull();
    expect(posted.addr).toContain('350 5th Ave');
    expect(posted.outOfArea).toBeUndefined();
    h.expectNoJsErrors(page);
  });
});
