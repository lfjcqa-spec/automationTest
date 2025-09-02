// src/core/context.ts

export interface TestContext {
  executionNo?: number; // 本次执行唯一编号
  currentSuite?: string;
  currentCase?: string;
  // 这里以后可以继续加，比如当前Loop ID 等
}
