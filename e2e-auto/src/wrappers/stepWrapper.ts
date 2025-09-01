import { test, Page } from '@playwright/test';
import { resolveStep } from '../core/step-registry';

// 定义 DB Step 类型
export interface DbStep {
  StepName: string;
  [key: string]: any; // 支持动态字段
}

export async function stepWrapper(
  page: Page,
  step: DbStep,
  options?: {
    beforeStep?: (stepName: string, data: DbStep) => Promise<void> | void;
    afterStep?: (stepName: string, data: DbStep, error?: Error) => Promise<void> | void;
  },
) {
  const stepName = step.StepName;
  const fn = resolveStep(stepName);

  return await test.step(`Step: ${stepName}`, async () => {
    if (options?.beforeStep) {
      await options.beforeStep(stepName, step);
    }

    let error: Error | undefined;
    try {
      await fn(page, step); // 执行真正的 step
    } catch (err: any) {
      error = err;
      throw err;
    } finally {
      if (options?.afterStep) {
        await options.afterStep(stepName, step, error);
      }
    }
  });
}
