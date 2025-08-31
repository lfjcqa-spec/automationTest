// 中文说明：这是 Playwright 的主配置文件。
// - testDir 指定测试目录，仅扫描 e2e-new/tests，不会扫描你旧项目的 tests。
// - projects 配置三大浏览器。
// - use 中设置 trace/video/screenshot 策略，可按需调整。

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // 仅运行此目录下的用例，确保与旧项目隔离
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // 这里用最简单的 reporter；你也可以换为 ['html'] 或自定义 reporter
   reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    trace: 'on-first-retry',       // 首次重试时采集 trace
    video: 'retain-on-failure',    // 失败保留视频
    screenshot: 'only-on-failure'  // 失败截图
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});