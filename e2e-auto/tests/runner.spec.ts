// e2e-auto/tests/runner.spec.ts
import { test } from '@playwright/test';
import { runAllSuites } from '../src/core/runner';
import { generateReport } from '../src/reporting/reporter';

test('执行所有Suite (动态DB)', async ({ page }) => {
  const results = await runAllSuites(page);
  generateReport(results);
});
