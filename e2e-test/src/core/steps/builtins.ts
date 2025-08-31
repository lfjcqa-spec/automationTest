import { TestContext } from '../context';
import { RunUnit } from '../types';

export const builtins = {
  openLogin: async (ctx: TestContext, unit: RunUnit) => {
    const { page, config } = ctx;
    await page.goto(config.appUrl);
    await page.waitForTimeout(300);
    console.log(`已打开 ${config.appUrl}，模拟登录用户：${config.login.username}`);
  },
  print: async (ctx: TestContext, unit: RunUnit) => {
    const dsName = unit.dataSet ? `${unit.dataSet.name}` : 'Default';
    console.log(
      `[PRINT] Suite=${unit.suite.name} Case=${unit.testCase.name} Loop#${
        unit.dataSet?.ordinal ?? 1
      } (${dsName}) Step=${unit.step.ordinal}.${unit.step.name}`,
    );
    console.log('       参数: ', unit.params);
    await ctx.page.waitForTimeout(200);
  },
};
