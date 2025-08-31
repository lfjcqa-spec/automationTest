// 步驟級 DataProvider 示例（放在 tests/suites）
import { test, expect } from '@playwright/test';
import { getDataCtx } from '../dataprovider/fixtures/dataCtx.dp';
import { createTestCtx } from '../dataprovider/fixtures/testCtx.dp';
import { StepDataProvider } from '../dataprovider/providers';

test.describe('DataProvider - Step level', () => {
  const dataCtx = getDataCtx();

  for (const row of StepDataProvider()) {
    const title = row.loopIndex != null
      ? `${row.suite}:${row.caseName}[loop=${row.loopIndex}] / ${row.stepName}`
      : `${row.suite}:${row.caseName} / ${row.stepName}`;

    test(title, async () => {
      const testCtx = createTestCtx(dataCtx, row.suite, row.caseName, row.loopIndex);
      const step = testCtx.indexByStepName.get(row.stepName);
      expect(step).toBeTruthy();

      // TODO: 在這裡根據 stepName 分派到實際動作
      // await actions[row.stepName]?.(page, row.param1, row.param2, row.param3);
    });
  }
});