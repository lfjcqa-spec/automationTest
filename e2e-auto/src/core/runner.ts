// e2e-auto/core/runner.ts
// 功能：统一按“实际执行模式”命名与分派；为同名 Case1 增加 A/B 别名；DataDriven 判定以 rows 长度为准。

import { test } from '@playwright/test';
import { loadSuiteModels } from '../src/loaders/suiteLoader'; // 你的套件加载函数（示例）
import { loadCaseRows } from '../src/loaders/dataLoader'; // 你的 DataDriven 数据加载函数（示例）
import { runCaseKeywordDriven } from '../src/executors/keyword'; // 关键字驱动执行入口（示例）
import { runCaseDataDriven } from '../src/executors/datadriven'; // 数据驱动执行入口（示例）

// 工具：为同名的用例设置别名 (A)/(B)
function assignAliasesForDuplicates(cases: Array<{ id?: string; name: string; alias?: string }>) {
  const map = new Map<string, number>();
  for (const c of cases) {
    const count = (map.get(c.name) ?? 0) + 1;
    map.set(c.name, count);
  }
  const counter: Record<string, number> = {};
  for (const c of cases) {
    const total = map.get(c.name) ?? 0;
    if (total > 1) {
      const idx = (counter[c.name] ?? 0) + 1;
      counter[c.name] = idx;
      c.alias = idx === 1 ? '(A)' : idx === 2 ? '(B)' : `(x${idx})`;
    }
  }
}

test.describe('[Runner] Suites', () => {
  test('Execute suites', async () => {
    const suites = await loadSuiteModels(); // 返回 { name, cases: [{ id, name, ... }] }[]
    for (const suite of suites) {
      // 先为本套件内重复名称的用例分配别名
      assignAliasesForDuplicates(suite.cases as any);

      for (const caseModel of suite.cases) {
        // 关键：不依赖 caseModel.category，先尝试加载数据行
        let rows: any[] = [];
        try {
          rows = (await loadCaseRows(caseModel)) ?? [];
        } catch (e) {
          // 加载失败时认为无数据行，走 KeywordDriven，但打印日志以便排查
          console.warn(`WARN: loadCaseRows failed for case "${caseModel.name}":`, e);
          rows = [];
        }

        const isDataDriven = rows.length > 0; // 以实际行数判断
        const execMode = isDataDriven ? 'DataDriven' : 'KeywordDriven';

        const displayName = caseModel.alias
          ? `${caseModel.name} ${caseModel.alias}`
          : caseModel.name;

        await test.step(`Case: [${suite.name}] ${displayName} (${execMode})`, async () => {
          if (isDataDriven) {
            // 数据驱动执行：一次 case 下跑多条 row（Loop）
            await runCaseDataDriven({ suite, caseModel, rows });
          } else {
            // 关键字驱动执行：按关键字序列执行一次
            await runCaseKeywordDriven({ suite, caseModel });
          }
        });
      }
    }
  });
});
