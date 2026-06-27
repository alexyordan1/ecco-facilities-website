// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * D57 — Combined (Janitorial + Day Porter) flow E2E.
 * Real flow (mirrors FLOWS in js/quote-flow.js):
 *   Welcome → Space → Size → Days (jan) → Schedule (DP) → Location → Info → Contact → Success.
 * NOTE 2026-06-20 — the `info`/"You" step was moved to the END (after
 * Location, before Contact); these tests assert that order.
 *
 * This is the most complex flow — it exercises the merge of the cleaning
 * schedule (janDays + timeOfDay) and the porter schedule (dpPorters), then
 * confirms both serialize correctly into the snapshot + payload.
 */

test.describe('Combined — full flow', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('1 — Happy path: cleaning Mon-Fri morning + 1 porter Mon-Fri 8-4', async ({ page }) => {
    await page.click('.qf2-card[data-service="both"]');
    await h.expectActive(page, 'qfScreen_space');

    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');

    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');

    await h.pickSchedule(page, 'Monday', 'morning');
    await h.expectActive(page, 'qfScreen_schedule');

    // Porter card defaults to Mon-Fri 8-4 — just continue.
    await page.click('#qfDpScheduleContinue');
    await h.expectActive(page, 'qfScreen_location');

    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_info');

    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_contact');

    // Editorial split: separate Cleaning + Porter coverage rows.
    await expect(page.locator('#qf2SumCleaning')).toContainText('Monday');
    await expect(page.locator('#qf2SumPorters')).toContainText(/Porter\s*1/);

    h.expectNoJsErrors(page);
  });

  test('2 — Cleaning weekends + 2 porters with different days', async ({ page }) => {
    await page.click('.qf2-card[data-service="both"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Retail');
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '6k-12k');
    await h.expectActive(page, 'qfScreen_days');

    // Pick Sat + Sun for cleaning + Anytime
    await page.click('#qfScreen_days .qf-day-card[data-day="Saturday"]');
    await page.click('#qfScreen_days .qf-day-card[data-day="Sunday"]');
    await page.click('#qfScreen_days .qf2-chip-time[data-time="flexible"]');
    await page.click('#qfDaysContinue');
    await h.expectActive(page, 'qfScreen_schedule');

    // 2 porters with custom schedules
    await h.pickPorterSchedule(page, {
      porters: [
        { days: ['Monday','Wednesday','Friday'], hours: '09:00-17:00' },
        { days: ['Tuesday','Thursday'], hours: '13:00-19:00' },
      ],
    });
    await h.expectActive(page, 'qfScreen_location');

    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_info');

    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_contact');

    await expect(page.locator('#qf2SumCleaning')).toContainText('Weekends');
    await expect(page.locator('#qf2SumPorters')).toContainText(/Porter\s*1/);
    await expect(page.locator('#qf2SumPorters')).toContainText(/Porter\s*2/);

    h.expectNoJsErrors(page);
  });

  test('3 — Snapshot Edit on Porter coverage row routes to schedule', async ({ page }) => {
    await page.click('.qf2-card[data-service="both"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday', 'morning');
    await h.expectActive(page, 'qfScreen_schedule');
    await page.click('#qfDpScheduleContinue');
    await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_contact');

    // Editorial split: Porter coverage Edit (data-edit="schedule") → Schedule.
    await page.click('.qf2-sum-row[data-section="porters"] .qf2-edit-btn[data-edit="schedule"]');
    await page.waitForTimeout(200);
    await page.click('.qf2-sum-edit-save');
    await h.expectActive(page, 'qfScreen_schedule');

    h.expectNoJsErrors(page);
  });

  test('4 — E: cleaning-day edits re-seed UNTOUCHED porter days, RESPECT customized', async ({ page }) => {
    const DP_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    // A collapsed porter card renders only its header/summary — the day picker
    // mounts on expand. So expand before reading/editing its day selection.
    async function openPorter(idx = 0) {
      const card = page.locator(`#qfDpPorters .qf-dp-porter[data-porter-idx="${idx}"]`).first();
      if (!(await card.evaluate((el) => el.classList.contains('is-open')))) {
        await card.locator('.qf-dp-porter-header').click();
        await page.waitForTimeout(120);
      }
      return card;
    }
    // Selected porter days for a given porter card, in week order.
    async function porterDays(idx = 0) {
      await openPorter(idx);
      const sel = page.locator(`#qfDpPorters .qf-dp-porter[data-porter-idx="${idx}"] .qf-day-card.is-selected`);
      const days = await sel.evaluateAll((els) => els.map((e) => e.getAttribute('data-day')));
      return days.sort((a, b) => DP_ORDER.indexOf(a) - DP_ORDER.indexOf(b));
    }
    // Time windows are single-select TOGGLES — re-clicking the active one
    // deselects it and breaks the Continue gate. Only click when none is set.
    async function ensureMorning() {
      if (!(await page.locator('#qfScreen_days .qf2-chip-time.is-selected').count())) {
        await page.click('#qfScreen_days .qf2-chip-time[data-time="morning"]');
      }
    }
    const backToDays = async () => {
      await page.locator('#qfScreen_schedule [data-qf2-back]:visible').first().click();
      await h.expectActive(page, 'qfScreen_days');
    };

    await page.click('.qf2-card[data-service="both"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');

    // Cleaning = Mon + Tue.
    await page.click('#qfScreen_days .qf-day-card[data-day="Monday"]');
    await page.click('#qfScreen_days .qf-day-card[data-day="Tuesday"]');
    await ensureMorning();
    await page.click('#qfDaysContinue');
    await h.expectActive(page, 'qfScreen_schedule');

    // Seed — porter pre-filled with the cleaning days the user just picked.
    expect(await porterDays()).toEqual(['Monday', 'Tuesday']);

    // ── Re-seed: change cleaning days WITHOUT touching the porter ──
    await backToDays();
    await page.click('#qfScreen_days .qf-day-card[data-day="Monday"]');    // deselect
    await page.click('#qfScreen_days .qf-day-card[data-day="Tuesday"]');   // deselect
    await page.click('#qfScreen_days .qf-day-card[data-day="Wednesday"]');
    await page.click('#qfScreen_days .qf-day-card[data-day="Thursday"]');
    await ensureMorning();
    await page.click('#qfDaysContinue');
    await h.expectActive(page, 'qfScreen_schedule');

    // FOLLOWED — porter days were untouched, so they track the new cleaning days.
    expect(await porterDays()).toEqual(['Wednesday', 'Thursday']);

    // ── Respect: customize the porter by hand, THEN change cleaning again ──
    const card = await openPorter(0);
    await card.locator('.qf-day-card[data-day="Friday"]').click(); // hand-edit → marks customized
    expect(await porterDays()).toEqual(['Wednesday', 'Thursday', 'Friday']);

    await backToDays();
    await page.click('#qfScreen_days .qf-day-card[data-day="Wednesday"]'); // deselect
    await page.click('#qfScreen_days .qf-day-card[data-day="Thursday"]');  // deselect
    await page.click('#qfScreen_days .qf-day-card[data-day="Monday"]');
    await ensureMorning();
    await page.click('#qfDaysContinue');
    await h.expectActive(page, 'qfScreen_schedule');

    // RESPECTED — porter was customized, so it does NOT re-seed to the cleaning days.
    expect(await porterDays()).toEqual(['Wednesday', 'Thursday', 'Friday']);

    h.expectNoJsErrors(page);
  });

  test('PARITY — Combined review summary (snapshot of current output)', async ({ page }) => {
    await page.click('.qf2-card[data-service="both"]'); await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday', 'morning'); await h.expectActive(page, 'qfScreen_schedule');
    await page.click('#qfDpScheduleContinue'); await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page, { role: 'Facilities Manager' }); await h.expectActive(page, 'qfScreen_contact');
    const txt = await h.readSummaryText(page);
    expect(txt).toContain('Combined');
    expect(txt).toContain('Day porter plus janitorial');
    expect(txt).toContain('Office');
    expect(txt).toContain('Monday');                        // cleaning days
    expect(txt).toContain('Mornings (loosely 6 am–noon)');  // windows now shown in Combined (was the bug)
    expect(txt).toContain('Porter 1');                      // porter coverage row
    expect(txt).toContain('Test User');
    expect(txt).toContain('test+e2e@example.com');
    expect(txt).toContain('Facilities Manager');
    // Extras row hidden when no situation/timeline provided.
    await expect(page.locator('#qfScreen_contact .qf2-sum-row[data-section="extras"]')).toBeHidden();
    h.expectNoJsErrors(page);
  });
});
