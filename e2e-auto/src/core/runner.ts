import { test } from '@playwright/test';
import { loadConfig } from '../config/env.js';
import { TestContext } from './context.js';
import { fixtures } from './fixtures.js';
import { CaseCategory, RunUnit } from './types.js';
import { readModelFromDb, resolveParamsForUnit } from '../dbAccessFacade.js';

test.describe('E2E Auto Runner', () => {
  test('execute suites/cases/steps from DB', async () => {
    const config = loadConfig();
    const suites = await readModelFromDb(config);

    const ctx = new TestContext(config);
    await ctx.bootstrapBrowser();
    try {
      await fixtures.beforeSuite(ctx);

      for (const suite of suites) {
        for (const tc of suite.cases) {
          const caseTitle = `[${suite.name}] ${tc.name} (${tc.category})`;
          await test.step(caseTitle, async () => {
            const loops =
              tc.category === CaseCategory.DataDriven
                ? tc.dataSets
                : tc.dataSets.length > 0
                ? tc.dataSets
                : [{ id: null, name: 'Default', ordinal: 1 }];

            await fixtures.beforeCase(ctx, {
              suite,
              testCase: tc,
              dataSet: null,
              step: tc.steps[0] ?? { id: 0, ordinal: 0, name: 'Init', params: [] },
              params: {},
            });

            for (const loop of loops) {
              const loopTitle = `Loop#${loop.ordinal} - ${loop.name}`;
              await test.step(loopTitle, async () => {
                for (const step of tc.steps) {
                  const unit: RunUnit = {
                    suite,
                    testCase: tc,
                    dataSet: loop.id !== undefined ? loop : null,
                    step,
                    params: {},
                  };

                  // 从数据库解析参数
                  unit.params = await resolveParamsForUnit(unit);

                  await fixtures.beforeStep(ctx, unit);

                  // 第 1 步：打开 Google 并模拟登录；其余步骤打印参数
                  if (step.ordinal === 1) {
                    await ctx.page.goto(config.appUrl);
                    await ctx.page.waitForTimeout(300);
                    console.log(`模拟登录用户：${config.login.username}`);
                  } else {
                    console.log(
                      `[PRINT] Suite=${suite.name} Case=${tc.name} Loop#${loop.ordinal} Step=${step.ordinal}.${step.name} Params=`,
                      unit.params,
                    );
                    await ctx.page.waitForTimeout(150);
                  }

                  await fixtures.afterStep(ctx, unit);
                }
              });
            }

            await fixtures.afterCase(ctx, {
              suite,
              testCase: tc,
              dataSet: null,
              step: tc.steps[tc.steps.length - 1] ?? {
                id: 0,
                ordinal: 0,
                name: 'Done',
                params: [],
              },
              params: {},
            });
          });
        }
      }

      await fixtures.afterSuite(ctx);
    } finally {
      await ctx.teardownBrowser();
    }
  });
});
