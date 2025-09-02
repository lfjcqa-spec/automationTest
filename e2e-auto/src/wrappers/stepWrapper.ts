import { Page } from '@playwright/test';
import { resolveStep } from '../core/step-registry';
import { startStepResult, finishStepResult } from '../db/resultRepository';
import { StepResult } from './types';

export async function stepWrapper(
  page: Page,
  step: any,
  stepResults?: StepResult[],
  executionNo?: number,
  suiteName?: string,
  caseName?: string,
) {
  // ---- Step 开始 ----
  await startStepResult({
    executionNo: executionNo!,
    suiteName: suiteName!,
    caseName: caseName!,
    stepName: step.StepName,
  });

  try {
    const fn = resolveStep(step.StepName);
    await fn(page, step);

    stepResults?.push({ stepName: step.StepName, status: 'passed' });

    // ---- Step 成功 ----
    await finishStepResult({
      executionNo: executionNo!,
      suiteName: suiteName!,
      caseName: caseName!,
      stepName: step.StepName,
      status: 'passed',
    });
  } catch (err: any) {
    stepResults?.push({ stepName: step.StepName, status: 'failed', error: err.message });

    // ---- Step 失败 ----
    await finishStepResult({
      executionNo: executionNo!,
      suiteName: suiteName!,
      caseName: caseName!,
      stepName: step.StepName,
      status: 'failed',
      errorMessage: err.message,
    });
    throw err;
  }
}
