import { test, expect } from '../../fixtures/test-fixtures';
import { runSteps } from '../../steps/step-runner';
import type { Step, StepContext } from '../../steps/step-types';

// 1) 真实步骤实现库：按名称注册
const stepLibrary: Record<string, (ctx: StepContext, payload: any) => Promise<void> | void> = {
  async step1(ctx, p) {
    ctx.step?.log('[impl] step1', p);                 // step-level
    await ctx.step?.attach('step1.txt', JSON.stringify(p, null, 2), 'application/json'); // test-level
    ctx.vars.lastStep = 'step1';                      // test-level
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
  },
  async step4(ctx, p) {
    ctx.step?.log('[impl] step4', p);
    await ctx.step?.attach('step4.txt', JSON.stringify(p, null, 2), 'application/json');
    ctx.vars.lastStep = 'step4';
  }
};

// 2) 将数据文件中的 { caseName, steps[] } 转换为 Step[] 并执行
test.use({
  dataFile: 'tests/suites/suite2/suite2_data.json'
});

test('Suite2 数据驱动用例（按 case.steps 调度）', async ({ page, vars, dataRows }, testInfo) => {
  for (const testCase of dataRows as Array<{ caseName: string; steps: Array<any> }>) {
    const steps: Step[] = (testCase.steps || []).map((row, idx) => {
      const name = row.stepName || `step-${idx + 1}`;
      const impl = stepLibrary[name];
      return {
        name, // 用数据里的 stepName 命名
        async run(ctx) {
          // 明确日志归属
          ctx.step?.log(`[adapter] dispatch to impl="${name}"`, row); // step-level
          if (!impl) {
            ctx.step?.log(`[adapter] missing impl for "${name}"`);    // step-level
            throw new Error(`No implementation for step "${name}"`);
          }
          await impl(ctx, row); // 执行实际实现
          // 示例断言：上一实现写入的 test-level 变量
          expect(vars.lastStep).toBe(name); // test-level
        }
      };
    });

    await runSteps(
      test,
      steps,
      { page, vars },
      undefined, // 不再额外循环 dataRows；我们在外层遍历 case
      { suite: 'TestSuite2', testCase: testCase.caseName },
      testInfo
    );
  }
});