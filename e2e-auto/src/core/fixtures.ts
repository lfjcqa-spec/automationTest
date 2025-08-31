// 中文：定义 suite/case/step 级的前后置钩子（可按需扩展）
import { TestContext } from './context.js';
import { RunUnit, CaseModel, SuiteModel } from './types.js';

export type Hook = (ctx: TestContext, unit?: RunUnit) => Promise<void> | void;

export const fixtures = {
  // Suite 级
  beforeSuite: (async (_ctx: TestContext) => {
    // 可在这里做环境检查、清缓存、种测试数据等
  }) as Hook,
  afterSuite: (async (_ctx: TestContext) => {
    // 可在这里做资源清理
  }) as Hook,

  // Case 级
  beforeCase: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`开始执行 Case: ${unit?.testCase.name}（类别：${unit?.testCase.category}）`);
  }) as Hook,
  afterCase: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`结束执行 Case: ${unit?.testCase.name}`);
  }) as Hook,

  // Step 级
  beforeStep: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`  → Step ${unit?.step.ordinal}: ${unit?.step.name}`);
  }) as Hook,
  afterStep: (async (_ctx: TestContext, _unit?: RunUnit) => {
    // 可在这里收集截图、日志等
  }) as Hook,
};
