// e2e-old/suites/suite1/suite1.spec.ts
import { test, expect } from '../../fixtures/test-fixtures';
import { runStepsEx } from '../../steps/step-runner';
import type { Step, StepContext } from '../../steps/step-types';

import path from 'path';
test.use({
dataFile: path.resolve(__dirname, './suite1_data.json'),
});

// 业务步骤库
const stepLibrary: Record<string, (ctx: StepContext, payload: any) => Promise<void> | void> = {
  async step1(ctx, p) {
    ctx.step?.log('[impl] step1');
    await ctx.step?.attach('step1.txt', JSON.stringify(p, null, 2), 'application/json');
    ctx.vars.lastStep = 'step1';
  },
  async step2(ctx, p) {
    ctx.step?.log('[impl] step2');
    await ctx.step?.attach('step2.txt', JSON.stringify(p, null, 2), 'application/json');
    ctx.vars.lastStep = 'step2';
  },
  async step3(ctx, p) {
    ctx.step?.log('[impl] step3');
    await ctx.step?.attach('step3.txt', JSON.stringify(p, null, 2), 'application/json');
    ctx.vars.lastStep = 'step3';
  },
};

test.describe('Suite1', () => {
  test('Suite1 循環用例執行（按 loops 驅動，擴展 API）', async ({ page, vars, dataRows }, testInfo) => {
    // 空数据守卫
    if (!Array.isArray(dataRows) || dataRows.length === 0) {
      test.fail(true, '數據文件為空或未找到');
      test.skip();
      return;
    }

    const caseRow = dataRows[0];
    const caseName = caseRow.caseName || 'UnnamedCase';
    const loops = Array.isArray(caseRow.loops) ? caseRow.loops : [];

    for (const loop of loops) {
      const loopIndex = loop.loopIndex;
      const stepsFromData: any[] = Array.isArray(loop.steps) ? loop.steps : [];

      // 映射为标准 Step[]
      const steps: Step[] = stepsFromData.map((row, idx) => {
        const name = row.stepName || `step-${idx + 1}`;
        return {
          name,
          async run(ctx) {
            const payload = { ...row, loopIndex };
            ctx.step?.log('[adapter] dispatch to impl');
            const impl = stepLibrary[name];
            if (!impl) throw new Error(`未知的步驟實現: ${name}`);
            await impl(ctx, payload);
            expect(vars.lastStep).toBe(name);
          },
        };
      });

      // 执行步骤（扩展 API）
      await runStepsEx({
        test,
        steps,
        ctx: { page, vars, data: loop, testInfo },
        meta: { suite: 'TestSuite1', testCase: `${caseName}_loop${loopIndex}` },
        stepTitle: (s, i) => `${s.name} [loop=${loopIndex}, #${i + 1}]`,
        hooks: {
          beforeEachStep: async () => {},
          afterEachStep: async () => {}
        },
        attachments: {
          pre: true,
          logs: true,
          after: true
        },
        logger: {
          info: (msg, m) => console.log(msg, m || ''),
          warn: (msg, m) => console.warn(msg, m || ''),
          error: (msg, m) => console.error(msg, m || '')
        }
      });
    }
  });
});