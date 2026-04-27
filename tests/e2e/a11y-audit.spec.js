// @ts-check
const { test, expect } = require('@playwright/test');
const { default: AxeBuilder } = require('@axe-core/playwright');
const h = require('./helpers');

/**
 * D62 — WCAG 2.1 AA accessibility audit on every step of every flow.
 * Uses axe-core to detect violations programmatically.
 */

const wcag = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function audit(page, screenName) {
  const results = await new AxeBuilder({ page })
    .withTags(wcag)
    .disableRules(['region']) // disabled on intentional decorative landmarks
    .analyze();
  const summary = {
    screen: screenName,
    violations: results.violations.length,
    items: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      target: v.nodes[0]?.target,
    })),
  };
  return summary;
}

test.describe('A11y · Day Porter flow', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('Welcome', async ({ page }) => {
    const r = await audit(page, 'qfScreen_welcome');
    if (r.violations) console.log('Welcome violations:', JSON.stringify(r, null, 2));
    expect(r.violations).toBe(0);
  });

  test('Space', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    const r = await audit(page, 'qfScreen_space');
    if (r.violations) console.log('Space violations:', JSON.stringify(r, null, 2));
    expect(r.violations).toBe(0);
  });

  test('Info', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    const r = await audit(page, 'qfScreen_info');
    if (r.violations) console.log('Info violations:', JSON.stringify(r, null, 2));
    expect(r.violations).toBe(0);
  });

  test('Schedule (DP)', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');
    const r = await audit(page, 'qfScreen_schedule');
    if (r.violations) console.log('Schedule violations:', JSON.stringify(r, null, 2));
    expect(r.violations).toBe(0);
  });

  test('Schedule open porter card', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');
    await page.click('.qf-dp-porter-header');
    await page.waitForTimeout(400);
    const r = await audit(page, 'qfScreen_schedule (porter open)');
    if (r.violations) console.log('Schedule open violations:', JSON.stringify(r, null, 2));
    expect(r.violations).toBe(0);
  });

  test('Snapshot', async ({ page }) => {
    await page.click('.qf2-card[data-service="dayporter"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_schedule');
    await page.click('#qfDpScheduleContinue');
    await h.expectActive(page, 'qfScreen_location');
    await h.fillLocation(page);
    await h.expectActive(page, 'qfScreen_contact');
    const r = await audit(page, 'qfScreen_contact');
    if (r.violations) console.log('Snapshot violations:', JSON.stringify(r, null, 2));
    expect(r.violations).toBe(0);
  });
});

test.describe('A11y · Janitorial flow', () => {
  test.beforeEach(async ({ page }) => {
    await h.freshOpen(page);
  });

  test('Days screen', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');
    const r = await audit(page, 'qfScreen_days');
    if (r.violations) console.log('Days violations:', JSON.stringify(r, null, 2));
    expect(r.violations).toBe(0);
  });

  test('Location', async ({ page }) => {
    await page.click('.qf2-card[data-service="janitorial"]');
    await h.expectActive(page, 'qfScreen_space');
    await h.pickSpace(page, 'Office');
    await h.expectActive(page, 'qfScreen_info');
    await h.fillInfo(page);
    await h.expectActive(page, 'qfScreen_size');
    await h.pickSize(page, '1k-3k');
    await h.expectActive(page, 'qfScreen_days');
    await h.pickSchedule(page, 'Monday');
    await h.expectActive(page, 'qfScreen_location');
    const r = await audit(page, 'qfScreen_location');
    if (r.violations) console.log('Location violations:', JSON.stringify(r, null, 2));
    expect(r.violations).toBe(0);
  });
});
