import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // ✅ 改成 tests，而不是 src/tests
  timeout: 30 * 1000,
  retries: 0,
  reporter: [
    ['list'],
    ['./src/reporting/jsonReporter.ts'],
    ['html', { outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
