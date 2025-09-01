// src/core/runnerKD.ts
import { test } from '@playwright/test';
import { resolveStep } from './step-registry';
import { loadKDCaseSteps } from '../db/repositories';

export async function runKDCase(page, caseName: string) {
  const steps = await loadKDCaseSteps(caseName);

  for (const step of steps) {
    await test.step(step.StepName, async () => {
      const fn = resolveStep(step.StepName);
      await fn(page, step); // 👈 动态执行
    });
  }
}
