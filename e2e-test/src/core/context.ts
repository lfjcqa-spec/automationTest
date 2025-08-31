import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { AppConfig } from '../config/schema';

export class TestContext {
  browser!: Browser;
  ctx!: BrowserContext;
  page!: Page;

  constructor(public config: AppConfig) {}

  async bootstrapBrowser() {
    this.browser = await chromium.launch({
      headless: this.config.browser.headless,
      slowMo: this.config.browser.slowMo,
    });
    this.ctx = await this.browser.newContext({
      baseURL: this.config.browser.baseURL || this.config.appUrl,
    });
    this.page = await this.ctx.newPage();
  }

  async teardownBrowser() {
    await this.page?.close().catch(() => {});
    await this.ctx?.close().catch(() => {});
    await this.browser?.close().catch(() => {});
  }
}
