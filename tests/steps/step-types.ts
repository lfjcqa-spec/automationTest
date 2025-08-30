import type { Page } from '@playwright/test';
import type { Vars } from '../fixtures/test-fixtures';

export type StepPayload = Record<string, any>;

export type StepFixtures = {
  // step-level：在单个步骤内可用的工具
  startedAt: number;
  log: (...args: any[]) => void;
  attach: (name: string, body: Buffer | string, contentType?: string) => Promise<void>;
};

export type StepContext = {
  // test-level：跨步骤共享
  page: Page;
  vars: Vars;
  // step-level：仅当前步骤有效
  step?: StepFixtures;
};

export type Step = {
  name: string;
  useStepFixtures?: boolean;
  before?: (ctx: StepContext, payload: StepPayload) => Promise<void> | void;
  run: (ctx: StepContext, payload: StepPayload) => Promise<void> | void;
  after?: (ctx: StepContext, payload: StepPayload) => Promise<void> | void;
};