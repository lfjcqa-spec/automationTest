import { chromium, Browser, Page } from "@playwright/test";
import { envConfig } from "../config/env.js";
import { EnvConfig } from "../config/schema.js";  // ✅ 补上类型导入

export class TestContext {
  browser!: Browser;
  page!: Page;
  env: EnvConfig;

  constructor() {
    this.env = envConfig as EnvConfig;
  }

  async initBrowser() {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();  // ✅ 注意大小写 newPage
  }

  async closeBrowser() {
    await this.browser.close();
  }
}
