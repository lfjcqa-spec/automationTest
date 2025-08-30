// playwright.new.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e-new/tests',
  outputDir: 'e2e-new/tests/test-results',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'e2e-new/playwright-report' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});