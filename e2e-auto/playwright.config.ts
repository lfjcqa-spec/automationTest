import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const reportDir = process.env.PW_REPORT_DIR || 'playwright-report';

export default defineConfig({
  // 让 Playwright 到 src 下找测试
  testDir: './src',
  // 明确指定只运行这个入口文件（你的 runner.ts 在 core 目录）
  testMatch: ['**/core/runner.ts'],
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: undefined,
  reporter: [['html', { open: 'never', outputFolder: reportDir }], ['./src/reporting/reporter.ts']],
  // 将测试产物与 HTML 报告分离，避免冲突警告
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
