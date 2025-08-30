// tests/suites/suite2/suite2.spec.ts
// Suite2：示範“資料驅動”的用例，將資料檔案中的 steps 映射到標準 Step[]，
// 交給 runSteps 統一處理 test.step、日誌與附件。

import { test, expect } from '../../fixtures/test-fixtures';
import { runSteps } from '../../steps/step-runner';
import type { Step, StepContext } from '../../steps/step-types';



// 1) 真實步驟實現庫：按名稱註冊，在這裡只關注業務邏輯
const stepLibrary: Record<string, (ctx: StepContext, payload: any) => Promise<void> | void> = {
  async step1(ctx, p) {
    ctx.step?.log('[impl] step1'); // 自定義業務日誌（runner 會保存為附件）
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
  async step4(ctx, p) {
    ctx.step?.log('[impl] step4');
    await ctx.step?.attach('step4.txt', JSON.stringify(p, null, 2), 'application/json');
    ctx.vars.lastStep = 'step4';
  }
};

// 2) 測試層：將數據檔案中的 { caseName, steps[] } 轉為 Step[]，交給 runner 執行
import path from 'path';
test.use({
dataFile: path.resolve(__dirname, './suite2_data.json'),
});

test.describe('Suite2', () => {
  test.beforeAll(async () => {
    console.log('[SUITE PRE] Suite2 beforeAll');
  });

  test.afterAll(async () => {
    console.log('[SUITE AFTER] Suite2 afterAll');
  });

  test('Suite2 數據驅動用例（按 case.steps 調度）', async ({ page, vars, dataRows }, testInfo) => {
    console.log(`[TEST PRE] ${testInfo.title}`);

    for (const testCase of dataRows as Array<{ caseName: string; steps: Array<any> }>) {
      // 將數據步驟轉為標準 Step[]，每一步在 run 中調用實際實現
      const steps: Step[] = (testCase.steps || []).map((row, idx) => {
        const name = row.stepName || `step-${idx + 1}`;
        return {
          name, // 用資料中的 stepName 作為步驟名稱，便於報告追蹤
          async run(ctx) {
            // 適配層日誌，便於定位
            ctx.step?.log(`[adapter] dispatch to impl="${name}"`);
            const impl = stepLibrary[name];
            if (!impl) {
              ctx.step?.log(`[adapter] missing impl for "${name}"`);
              throw new Error(`No implementation for step "${name}"`);
            }
            await impl(ctx, row);          // 執行實際步驟
            expect(vars.lastStep).toBe(name); // 斷言：實現層有寫入 vars.lastStep
          }
        };
      });

      // 統一由 runner 執行（自動包 test.step + 前後日誌 + 附件處理）
      await runSteps(
        test,
        steps,
        { page, vars, data: testCase, testInfo }
      );
    }

    console.log(`[TEST AFTER] ${testInfo.title}`);
  });
});