import { test } from '@playwright/test';
import { loadConfig } from '../config/env';
import { TestContext } from './context';
import { fixtures } from './fixtures';
import { CaseCategory, RunUnit } from './types';
import { readModelFromDb, resolveParamsForUnit } from '../dbAccessFacade';
import { stepRegistry } from './steps/step-registry';

test.describe('E2E Test Runner', () => {
  test('execute suites/cases/steps from DB', async () => {
    const config = loadConfig();
    const ctx = new TestContext(config);
    await ctx.bootstrapBrowser();
    try {
      await fixtures.beforeSuite(ctx);

      const suites = await readModelFromDb(config);

      for (const suite of suites) {
        await fixtures.beforeSuite(ctx, {
          suite,
          testCase: suite.cases[0],
          dataSet: null,
          step: suite.cases[0]?.steps[0] ?? { id: 0, ordinal: 0, name: 'Init', params: [] },
          params: {},
        });

        for (const tc of suite.cases) {
          const caseTitle = `[${suite.name}] ${tc.name} (${tc.category})`;
          await test.step(caseTitle, async () => {
            await fixtures.beforeCase(ctx, {
              suite,
              testCase: tc,
              dataSet: null,
              step: tc.steps[0] ?? { id: 0, ordinal: 0, name: 'Init', params: [] },
              params: {},
            });

            const loops =
              tc.category === CaseCategory.DataDriven
                ? tc.dataSets
                : tc.dataSets.length > 0
                ? tc.dataSets
                : [{ id: null, name: 'Default', ordinal: 1 }];

            for (const loop of loops) {
              const loopTitle = `Loop#${loop.ordinal} - ${loop.name}`;
              await test.step(loopTitle, async () => {
                for (const step of tc.steps) {
                  const unit: RunUnit = {
                    suite,
                    testCase: tc,
                    dataSet: loop.id !== null ? loop : null,
                    step,
                    params: {},
                  };

                  unit.params = await resolveParamsForUnit(unit);

                  await fixtures.beforeStep(ctx, unit);

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

        await fixtures.afterSuite(ctx, {
          suite,
          testCase: suite.cases[suite.cases.length - 1],
          dataSet: null,
          step: suite.cases[suite.cases.length - 1]?.steps[
            suite.cases[suite.cases.length - 1].steps.length - 1
          ] ?? { id: 0, ordinal: 0, name: 'Done', params: [] },
          params: {},
        });
      }

      await fixtures.afterSuite(ctx);
    } finally {
      await ctx.teardownBrowser();
    }
  });
});
