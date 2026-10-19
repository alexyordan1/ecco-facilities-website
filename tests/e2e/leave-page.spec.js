// @ts-check
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

/**
 * 2026-10-19 — the native "Leave site?" prompt is gone (audit MOD-14, decided by
 * Alex): the draft autosaves and the resume banner covers the case. Exits are
 * measured on pagehide instead, and the review's Privacy Policy link opens in a
 * new tab so it no longer pulls the visitor out of the form.
 */
const startAnswering = async (page) => {
  await page.click('.qf2-card[data-service="janitorial"]'); await h.expectActive(page, 'qfScreen_space');
  await h.pickSpace(page, 'Office'); await h.expectActive(page, 'qfScreen_size');
};

test.describe('Leaving the page', () => {
  test('closing mid-flow shows no "Leave site?" prompt and the draft is kept', async ({ page, context }) => {
    await h.freshOpen(page);
    await startAnswering(page);
    // Nothing on the page cancels beforeunload any more (the old handler called
    // preventDefault and set returnValue, which is what makes browsers prompt).
    const prevented = await page.evaluate(() => {
      const e = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(e);
      return { defaultPrevented: e.defaultPrevented, returnValue: e.returnValue };
    });
    expect(prevented).toEqual({ defaultPrevented: false, returnValue: true });
    const dialogs = [];
    page.on('dialog', async (d) => { dialogs.push(d.type()); await d.accept(); });
    const closed = page.waitForEvent('close');
    await page.close({ runBeforeUnload: true });
    await closed;
    expect(dialogs).toEqual([]);
    // The draft survives the exit: read it from a sibling page of the same context.
    const again = await context.newPage();
    await again.goto('/quote.html');
    expect(await again.evaluate(() => !!localStorage.getItem('ecco_quote_draft_v1'))).toBe(true);
    await expect(again.locator('.qf-resume-banner')).toBeVisible();
    await again.close();
  });

  test('a real exit mid-flow logs one quote_abandon with the step', async ({ page }) => {
    await h.freshOpen(page);
    await startAnswering(page);
    const events = await page.evaluate(() => {
      window.dispatchEvent(new Event('pagehide'));
      return (window.dataLayer || []).filter((e) => e && e.event === 'quote_abandon');
    });
    expect(events).toHaveLength(1);
    expect(events[0].current_step).toBe('size');
    expect(events[0].service).toBe('janitorial');
    h.expectNoJsErrors(page);
  });

  test('leaving while the POST is in flight logs no abandon', async ({ page }) => {
    await h.freshOpen(page);
    await startAnswering(page);
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
    let release;
    const posted = new Promise((r) => { release = r; });
    await page.route('**/api/submit-quote', async (route) => {
      release();
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ref: 'ECJ-TEST123' }) });
    });
    await page.locator('#qfContactSubmit').scrollIntoViewIfNeeded();
    await page.click('#qfContactSubmit');
    await posted; // the POST has left
    const events = await page.evaluate(() => {
      window.dispatchEvent(new Event('pagehide'));
      return (window.dataLayer || []).filter((e) => e && e.event === 'quote_abandon');
    });
    expect(events).toHaveLength(0);
  });

  test('nothing answered yet: an exit logs no abandon', async ({ page }) => {
    await h.freshOpen(page, '/quote.html?service=dayporter');
    await h.expectActive(page, 'qfScreen_space');
    const events = await page.evaluate(() => {
      window.dispatchEvent(new Event('pagehide'));
      return (window.dataLayer || []).filter((e) => e && e.event === 'quote_abandon');
    });
    expect(events).toHaveLength(0);
    h.expectNoJsErrors(page);
  });

  test('the Privacy Policy link in the review opens in a new tab and the form stays', async ({ page, context }) => {
    await h.freshOpen(page);
    await startAnswering(page);
    await h.pickSize(page, '1k-3k'); await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday'); await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page); await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page); await h.expectActive(page, 'qfScreen_contact');
    const link = page.locator('#qfScreen_contact .qf2-legal-note a');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
    await popup.waitForLoadState();
    expect(popup.url()).toContain('privacy');
    await popup.close();
    await h.expectActive(page, 'qfScreen_contact');
    h.expectNoJsErrors(page);
  });
});
