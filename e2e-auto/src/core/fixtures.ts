// e2e-auto/src/core/fixtures.ts
// 中文注释：定义 Suite、Case、Step 的前置/后置钩子函数，目前仅打印日志，可扩展为实际操作
import { TestContext } from "./context";

export const Fixtures = {
  async beforeSuite(suite: any, ctx: TestContext, data: Record<string, any>) {
    console.log(`🟢 [BeforeSuite] ${suite.Name}`, data);
    // 中文注释：可添加 Suite 前置操作，如初始化日志
  },
  async afterSuite(suite: any, ctx: TestContext, data: Record<string, any>) {
    console.log(`🔴 [AfterSuite] ${suite.Name}`, data);
    // 中文注释：可添加 Suite 后置操作，如清理资源
  },

  async beforeCase(c: any, ctx: TestContext, data: Record<string, any>) {
    console.log(`🟢 [BeforeCase] ${c.CaseName}`, data);
    // 中文注释：可添加 Case 前置操作，如数据准备
  },
  async afterCase(c: any, ctx: TestContext, data: Record<string, any>) {
    console.log(`🔴 [AfterCase] ${c.CaseName}`, data);
    // 中文注释：可添加 Case 后置操作，如状态重置
  },

  async beforeStep(step: any, ctx: TestContext, data: Record<string, any>) {
    console.log(`🟢 [BeforeStep] ${step.StepName}`, data);
    // 中文注释：可添加 Step 前置操作，如截图
  },
  async afterStep(step: any, ctx: TestContext, data: Record<string, any>) {
    console.log(`🔴 [AfterStep] ${step.StepName}`, data);
    // 中文注释：可添加 Step 后置操作，如验证
  }
};
