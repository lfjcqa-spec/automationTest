// 中文：内置步骤实现
import { TestContext } from '../context.js';
import { RunUnit } from '../types.js';

export const builtins = {
  // 第一个步骤：打开 Google 并“模拟登录 APP”
  openLogin: async (ctx: TestContext, unit: RunUnit) => {
    const { page, config } = ctx;
    await page.goto(config.appUrl);
    await page.waitForTimeout(300);
    console.log(`已打开 ${config.appUrl}，模拟登录用户：${config.login.username}`);
  },

  // 其他步骤：打印说明与参数
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
