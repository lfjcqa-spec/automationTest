// 中文：Runner（每个 DB Test Case 对应一个逻辑测试条目，内部顺序执行 Steps，并对 DataDriven 的 DataSet 进行循环）
// 说明：Playwright 不支持在运行期动态新增 test()；为保持“test=case”的语义清晰，我们在单个 test 中按 Case 包成大段 test.step。
// 如需每个 Case 都成为独立 test，可做“静态代码生成”；本项目默认以可维护性为先。
import { test } from '@playwright/test';
import { loadConfig } from '../config/env.js';
import { TestContext } from './context.js';
import { fixtures } from './fixtures.js';
import { buildCaseProvidersForAllSuites } from './dataprovider.js';
import { readModelFromDb } from '../dbAccessFacade.js';
import { pickParamsFromSp, resolveParamsForUnit } from '../dbAccessFacade.js';
import { spGetCasesDesignJson } from '../db/sp.js'; // 只保留这一处关于 sp 的导入
import { SuiteModel } from './types.js';

const config = loadConfig();
const ctx = new TestContext(config);

// 并行准备结构化模型 + 存储过程 JSON
let suitesModelsPromise: Promise<SuiteModel[]> = readModelFromDb(config);
let spCasesPromise = (async () => {
  try {
    return await spGetCasesDesignJson({
      suiteName: config.suiteFilter ?? null,
      categoryName: null,
      caseName: config.caseFilter ?? null,
    });
  } catch {
    return [];
  }
})();

test.describe.configure({ mode: 'serial' }); // 串行确保顺序更直观

test.beforeAll(async () => {
  await ctx.bootstrapBrowser();
  await Promise.all([suitesModelsPromise, spCasesPromise]);
});

test.afterAll(async () => {
  await ctx.teardownBrowser();
});

test.describe('E2E 自动化（按 Test Case 执行）', () => {
  test('执行所有 Test Case（按 Suite→Case→DataSet→Step 展开）', async () => {
    const [suites, spCases] = await Promise.all([suitesModelsPromise, spCasesPromise]);

    // Suite 级一次性前置
    await fixtures.beforeSuite(ctx);

    const caseUnits = buildCaseProvidersForAllSuites(suites);

    for (const cu of caseUnits) {
      const { suiteName, caseModel } = cu;

      // 把每个 Case 用 test.step 包裹，尽可能接近“test=case”的呈现
      await test.step(`Case: [${suiteName}] ${caseModel.name}`, async () => {
        // Case 级前置
        await fixtures.beforeCase(ctx, {
          suite: { id: 0, name: suiteName, cases: [] },
          testCase: caseModel,
          dataSet: null,
          step: { id: 0, ordinal: 0, name: 'BeforeCase', params: [] },
          params: {},
        });

        // 选出本 Case 对应的 SP 输出（若存在）
        const spCase = spCases.find(
          (c: any) => c.caseName === caseModel.name && c.suiteName === suiteName,
        );

        // DataSet 列表：若 KeywordDriven 且无 DataSet，则给一个默认
        const dsList = caseModel.dataSets.length
          ? caseModel.dataSets
          : [{ id: null, name: 'Default', ordinal: 1 }];

        // 遍历 DataSet(Loop)
        for (const ds of dsList) {
          // 遍历 Steps
          for (const step of caseModel.steps) {
            const unit = {
              suite: { id: 0, name: suiteName, cases: [] },
              testCase: caseModel,
              dataSet: ds as any,
              step,
              params: {},
            };

            // 参数注入：优先 SP，回退逐表
            unit.params = spCase
              ? pickParamsFromSp(spCase, ds.ordinal, step.name)
              : await resolveParamsForUnit(unit);

            await fixtures.beforeStep(ctx, unit);

            // Step 用 test.step 呈现
            await test.step(`Loop#${ds.ordinal} ${ds.name} → Step ${step.ordinal}.${step.name}`, async () => {
              if (step.ordinal === 1) {
                await (await import('./steps/step-registry.js')).stepRegistry.openLogin(ctx, unit);
              } else {
                await (await import('./steps/step-registry.js')).stepRegistry.print(ctx, unit);
              }
            });

            await fixtures.afterStep(ctx, unit);
          }
        }

        // Case 级后置
        await fixtures.afterCase(ctx, {
          suite: { id: 0, name: suiteName, cases: [] },
          testCase: caseModel,
          dataSet: null,
          step: { id: 0, ordinal: 0, name: 'AfterCase', params: [] },
          params: {},
        });
      });
    }

    // Suite 级一次性后置
    await fixtures.afterSuite(ctx);
  });
});
