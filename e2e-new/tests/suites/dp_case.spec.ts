// 用例級 DataProvider 示例（放在 tests/suites）
// 相對路徑：從 suites 回到 dataprovider 取 fixtures/providers
import { test } from '@playwright/test';
import { getDataCtx } from '../dataprovider/fixtures/dataCtx.dp';
import { createTestCtx } from '../dataprovider/fixtures/testCtx.dp';
import { CaseDataProvider } from '../dataprovider/providers/caseProvider';

test.describe('DataProvider - Case level', () => {
  const dataCtx = getDataCtx();

  for (const row of CaseDataProvider()) {
    const title = row.loopIndex != null
      ? `${row.suite}:${row.caseName}[loop=${row.loopIndex}]`
      : `${row.suite}:${row.caseName}`;

    test(title, async ({}, testInfo) => {
      const testCtx = createTestCtx(dataCtx, row.suite, row.caseName, row.loopIndex);

      // 示例：把步驟與參數寫入附件，方便在報告查看
      let log = '';
      for (const stepName of row.steps) {
        const s = testCtx.indexByStepName.get(stepName);
        const params = [s?.param1, s?.param2, s?.param3].filter(Boolean).join(' | ');
        log += `${stepName} -> ${params}\n`;
      }
      await testInfo.attach('steps', { body: log, contentType: 'text/plain' });
    });
  }
});