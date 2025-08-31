import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

// 中文：报告目录环境变量，未设置则默认 'playwright-report'
const reportDir = process.env.PW_REPORT_DIR || 'playwright-report';

export default defineConfig({
  testDir: './src',
  testMatch: ['**/core/runner.ts'],
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: undefined,
  reporter: [['html', { open: 'never', outputFolder: reportDir }], ['./src/reporting/reporter.ts']],
  outputDir: path.join('test-results'),
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: '',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
