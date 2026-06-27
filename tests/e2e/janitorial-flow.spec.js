// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * Sprint 5 D24 — Janitorial flow E2E.
 * Real flow (mirrors FLOWS in js/quote-flow.js):
 *   Welcome → Space → Size → Days → Location → Info → Contact.
 * NOTE 2026-06-20 — the `info`/"You" step was moved from right-after-Space
 * to the END (after Location, before Contact). These tests assert that order.
 *
 * NOTE: every transition has a 400ms `_qfTransitioning` guard + a CSS
 * crossfade. Tests must `expectActive` after EVERY click that triggers a
 * navigation, otherwise the next click fires while the guard is still
 * locked and silently no-ops.
 */

test.describe('Janitorial — full flow', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('full happy path Welcome → Contact', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');

    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');

    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');

    await h.pickSchedule(page, 'Monday');
    await h.expectActive(page, 'qfScreen_location');

    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_info');

    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_contact');

    h.expectNoJsErrors(page);
  });

  test('Step 3 — exact sq ft Continue advances (D23 regression)', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');

    await h.pickSizeExact(page, 1500);
    await h.expectActive(page, 'qfScreen_days');

    h.expectNoJsErrors(page);
  });

  test('Step 3 — Enter on numeric input also advances', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');

    await page.fill('#qfSizeCustom', '2400');
    await page.locator('#qfSizeCustom').press('Enter');
    await h.expectActive(page, 'qfScreen_days');

    h.expectNoJsErrors(page);
  });

  test('Step 3 — invalid sq ft (under 100) shows error, stays on screen', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');

    await page.fill('#qfSizeCustom', '50');
    await page.click('#qf2SizeContinue');
    // Should NOT have advanced — still on size screen.
    await expect(page.locator('#qfScreen_size')).toHaveClass(/is-active/);
  });

  test('Step 3 — visit_required card flags needsSiteWalk and advances', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');

    await h.pickSize(page, 'visit_required');
    await h.expectActive(page, 'qfScreen_days');
    h.expectNoJsErrors(page);
  });

  test('Step 2 — catch-all input describes a non-listed space', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await page.fill('#qf2SpaceOther', 'warehouse');
    await page.click('#qf2SpaceContinue');
    await h.expectActive(page, 'qfScreen_size');
    h.expectNoJsErrors(page);
  });

  test('Step 3 — Continue advances when card was previously picked + back-navigated (D50)', async ({ page }) => {
    // Repro: user picks a size CARD → advances → goes back → clicks Continue.
    // Before D50 the Continue handler returned early because the numeric
    // input was empty, so the form looked frozen.
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');
    await page.click('.qf2-size-card[data-size="3k-6k"]');
    await h.expectActive(page, 'qfScreen_days');
    // Back to Size — pick the visible back arrow (desktop or mobile flowbar)
    const backBtn = page.locator('#qfScreen_days [data-qf2-back]:visible').first();
    await backBtn.click();
    await h.expectActive(page, 'qfScreen_size');
    // The card should still show as selected
    await expect(page.locator('.qf2-size-card[data-size="3k-6k"]')).toHaveClass(/is-selected/);
    // Click Continue — should advance back to Days
    await page.click('#qf2SizeContinue');
    await h.expectActive(page, 'qfScreen_days');
    h.expectNoJsErrors(page);
  });

  test('D53 — funnel telemetry pushes step events to dataLayer', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');
    // Inspect dataLayer for the events we expect.
    const events = await page.evaluate(() => (window.dataLayer || []).map(e => e.event));
    expect(events).toContain('quote_step_view');
    expect(events).toContain('quote_step_complete');
    // Verify a step_view payload has the expected shape
    const stepView = await page.evaluate(() => (window.dataLayer || []).find(e => e.event === 'quote_step_view' && e.step_name === 'space'));
    expect(stepView).toBeTruthy();
    expect(stepView.step_index).toBeGreaterThanOrEqual(0);
    h.expectNoJsErrors(page);
  });

  test('Step 4 — Continue blocked without time-window selection (D49)', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');
    await page.click('.qf2-size-card[data-size="3k-6k"]');
    await h.expectActive(page, 'qfScreen_days');
    // Pick a day but NO time window
    await page.click('#qfScreen_days .qf-day-card[data-day="Monday"]');
    // Continue should be disabled
    await expect(page.locator('#qfDaysContinue')).toBeDisabled();
    // Pick a time window — Continue enables
    await page.click('#qfScreen_days .qf2-chip-time[data-time="morning"]');
    await expect(page.locator('#qfDaysContinue')).toBeEnabled();
    await page.click('#qfDaysContinue');
    await h.expectActive(page, 'qfScreen_location');
  });

  test('PARITY — Janitorial review summary (snapshot of current output)', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday', 'morning'); await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page, { role: 'Facilities Manager' }); await h.expectActive(page, 'qfScreen_contact');
    const txt = await h.readSummaryText(page);
    expect(txt).toContain('Commercial Cleaning');
    expect(txt).toContain('Recurring after-hours cleaning');
    expect(txt).toContain('Office');
    expect(txt).toContain('1,000–3,000 sq ft');
    expect(txt).toContain('Monday');
    expect(txt).toContain('Mornings (loosely 6 am–noon)');
    expect(txt).toContain('Test User');
    expect(txt).toContain('test+e2e@example.com');
    expect(txt).toContain('Facilities Manager');
    // Porter coverage row hidden (no porters in janitorial).
    await expect(page.locator('#qfScreen_contact .qf2-sum-row[data-section="porters"]')).toBeHidden();
    h.expectNoJsErrors(page);
  });

  test('Review surfaces the phone the instant it is added via the opt-in', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday', 'morning'); await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
    await page.click('#qf2PhoneOptinToggle');
    await page.fill('#qfUserPhone', '5551234567');
    // Live re-render surfaces the phone in "Your details".
    await expect(page.locator('#qf2SumYou')).toContainText(/555/, { timeout: 2500 });
    h.expectNoJsErrors(page);
  });

  test('Review shows the in-person-visit treatment for a visit_required size', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, 'visit_required'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday', 'morning'); await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
    await expect(page.locator('#qf2SumSpace')).toContainText('size to be measured');
    await expect(page.locator('#qf2SumSpace')).toContainText('measure on-site');
    await expect(page.locator('#qfContactSubmit')).toContainText('book visit');
    h.expectNoJsErrors(page);
  });
});
