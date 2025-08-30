// playwright.old.config.js
const { defineConfig, devices } = require('@playwright/test');
const PREPOST_REPORTER_PATH = require.resolve('./reporters/prepost-reporter.js');

module.exports = defineConfig({
  testDir: 'e2e-old',
  outputDir: 'e2e-old/test-results',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'e2e-old/playwright-report' }],
    [PREPOST_REPORTER_PATH, { logDir: 'e2e-old/test-results/logs' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});