// tests/steps/step-types.ts
// 加強型別，支援可擴展 Options 與 Hooks。

import type { Page, TestInfo } from '@playwright/test';

export type StepPayload = any;

export type StepApi = {
  startedAt?: number;
  log: (line: string) => Promise<void> | void;
  attach: (name: string, body: string | Buffer, contentType?: string) => Promise<void> | void;
};

export type StepContext = {
  page: Page;
  data?: any;
  vars: Record<string, any>;
  testInfo?: TestInfo;
  step?: StepApi;
};

export type Step = {
  name: string;
  title?: string;
  run: (ctx: StepContext) => Promise<void> | void;
};

export type StepHooks = {
  // 在每個步驟 test.step 內部執行前呼叫
  beforeEachStep?: (args: { index: number; step: Step; ctx: StepContext }) => Promise<void> | void;
  // 在每個步驟 test.step 完成後呼叫（成功或失敗都會呼叫，error 會傳入）
  afterEachStep?: (args: { index: number; step: Step; ctx: StepContext; error?: unknown }) => Promise<void> | void;
};

export type StepLogger = {
  info?: (msg: string, meta?: any) => void;
  warn?: (msg: string, meta?: any) => void;
  error?: (msg: string, meta?: any) => void;
};

export type RunStepsOptions = {
  test: any;              // Playwright 的 test 實例（typeof import('@playwright/test').test）
  steps: Step[];          // 要執行的步驟列表
  ctx: StepContext;       // 上下文
  meta?: Record<string, any>; // 任意元資料，會在 hooks 和 logger 中傳遞
  hooks?: StepHooks;          // 可選的前後置鉤子
  stepTitle?: (step: Step, index: number) => string; // 自訂步驟標題
  attachments?: {
    pre?: boolean;        // 是否自動附加 PRE 文本
    logs?: boolean;       // 是否自動附加 log 文本
    after?: boolean;      // 是否自動附加 AFTER 文本
  };
  logger?: StepLogger;    // 可注入外部 logger（如 pino、winston）
};