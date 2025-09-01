// src/core/runner.ts
import { test } from '@playwright/test';
import { loadSuites, loadCases } from '../db/repositories';
import { runDDCase } from './runnerDD';
import { runKDCase } from './runnerKD';

export async function runAllSuites(page) {
  const suites = await loadSuites();
  const results: any[] = [];

  for (const suite of suites) {
    await test.step(`Suite: ${suite.Name}`, async () => {
      const cases = await loadCases(suite.Id);

      for (const c of cases) {
        await test.step(`Case: ${c.CaseName}`, async () => {
          if (c.CaseCategory === 'DD') {
            await runDDCase(page, c.CaseName);
          } else {
            await runKDCase(page, c.CaseName);
          }
        });
      }
    });
  }

  return results;
}
