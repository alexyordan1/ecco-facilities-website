// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Sprint 5 D24 — Playwright E2E config for the quote form flow.
 *
 * Catches the class of silent-fail bugs that the unit-less /impeccable
 * audit + critique missed (the #qfSizeSubmit dead-reference being the
 * canonical example). Tests boot the existing serve.js dev server,
 * navigate the live HTML, and assert that each service-path advances
 * step-by-step without console errors.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Surface JS errors as test failures — the whole reason these tests
    // exist is to catch silent failures like the sq ft Continue bug.
    contextOptions: {
      ignoreHTTPSErrors: true,
    },
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'node serve.js',
    port: 8080,
    timeout: 30 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
