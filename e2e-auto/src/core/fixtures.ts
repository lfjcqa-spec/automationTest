// 中文：定义 suite/case/step 级的前后置钩子
import { TestContext } from './context.js';
import { RunUnit } from './types.js';

export type Hook = (ctx: TestContext, unit?: RunUnit) => Promise<void> | void;

export const fixtures = {
  beforeSuite: (async (_ctx: TestContext) => {
    console.log('[beforeSuite] 环境准备完成');
  }) as Hook,
  afterSuite: (async (_ctx: TestContext) => {
    console.log('[afterSuite] 环境清理完成');
  }) as Hook,

  beforeCase: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`[beforeCase] ${unit?.testCase.name} (${unit?.testCase.category})`);
  }) as Hook,
  afterCase: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`[afterCase] ${unit?.testCase.name}`);
  }) as Hook,

  beforeStep: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`  → Step ${unit?.step.ordinal}: ${unit?.step.name}`);
  }) as Hook,
  afterStep: (async (_ctx: TestContext, _unit?: RunUnit) => {
    // 这里可以收集截图、日志等
  }) as Hook,
};
