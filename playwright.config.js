// playwright.config.js（CJS）
const { defineConfig, devices } = require('@playwright/test');
const PREPOST_REPORTER_PATH = require.resolve('./reporters/prepost-reporter.js');

module.exports = defineConfig({
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    [PREPOST_REPORTER_PATH, { logDir: 'test-results/logs' }]
  ],
  use: { trace: 'on-first-retry', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  outputDir: 'test-results'
});