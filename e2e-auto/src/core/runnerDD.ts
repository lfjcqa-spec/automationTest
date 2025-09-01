// src/core/runnerDD.ts
import { test } from '@playwright/test';
import { loadDDCaseSteps, loadDDCaseData } from '../db/repositories';
import { resolveStep } from './step-registry';

export async function runDDCase(page, caseName: string) {
  const steps = await loadDDCaseSteps(caseName);
  const loops = await loadDDCaseData(caseName);

  for (const loop of loops) {
    await test.step(`Loop: ${loop.LoopName}`, async () => {
      for (const step of steps) {
        await test.step(step.StepName, async () => {
          const fn = resolveStep(step.StepName);
          await fn(page, { ...loop, ...step });
        });
      }
    });
  }
}
