import { test, expect } from '../../fixtures/test-fixtures';
import { runSteps } from '../../steps/step-runner';
import type { Step, StepContext } from '../../steps/step-types';

test.use({
  dataFile: 'tests/suites/suite1/suite1_data.json'
});

// 业务步骤实现库（与 Suite2 一致的风格）
const stepLibrary: Record<string, (ctx: StepContext, payload: any) => Promise<void> | void> = {
  async step1(ctx, p) {
    ctx.step?.log('[impl] step1', p);
    await ctx.step?.attach('step1.txt', JSON.stringify(p, null, 2), 'application/json');
    ctx.vars.lastStep = 'step1';
  },
  async step2(ctx, p) {
    ctx.step?.log('[impl] step2', p);
    await ctx.step?.attach('step2.txt', JSON.stringify(p, null, 2), 'application/json');
    ctx.vars.lastStep = 'step2';
  },
  async step3(ctx, p) {
    ctx.step?.log('[impl] step3', p);
    await ctx.step?.attach('step3.txt', JSON.stringify(p, null, 2), 'application/json');
    ctx.vars.lastStep = 'step3';
  }
};

test('Suite1 循环用例执行（按 loops 驱动）', async ({ page, vars, dataRows }, testInfo) => {
  if (!dataRows.length) test.fail(true, '数据文件为空');

  const caseRow = dataRows[0];
  const caseName = caseRow.caseName || 'UnnamedCase';
  const loops = Array.isArray(caseRow.loops) ? caseRow.loops : [];

  // 针对每个 loop，直接把 loop.steps 映射为 Step[]，这样 runner 会为每个 step 打印摘要
  for (const loop of loops) {
    const loopIndex = loop.loopIndex;
    const stepsFromData: any[] = Array.isArray(loop.steps) ? loop.steps : [];

    // 将数据 steps[] 适配为 Step[]；payload 为每条步骤原样（外加 loopIndex）
    const steps: Step[] = stepsFromData.map((row, idx) => {
      const name = row.stepName || `step-${idx + 1}`;
      const impl = stepLibrary[name];
      return {
        name,
        async run(ctx) {
          const payload = { ...row, loopIndex };
          ctx.step?.log('[adapter] dispatch to impl', { name, payload });
          if (!impl) throw new Error(`未知的步骤实现: ${name}`);
          await impl(ctx, payload);
          expect(vars.lastStep).toBe(name); // test-level 断言
        }
      };
    });

    await runSteps(
      test,
      steps,
      { page, vars },
      undefined, // 直接执行映射后的 Step[]，不再传入 dataRows
      { suite: 'TestSuite1', testCase: `${caseName}_loop${loopIndex}` },
      testInfo
    );
  }
});