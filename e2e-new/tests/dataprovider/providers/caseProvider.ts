// 中文说明：CaseDataProvider（用例级）
// - 输出的每一行代表一个“用例切片”（Suite1 还会带 loopIndex）。
// - 我们将 steps 声明为 readonly string[]，表示这个数组是只读的，防止测试里误改顺序。

import { getDataCtx } from '../fixtures/dataCtx.dp';
import { createTestCtx } from '../fixtures/testCtx.dp';

export type CaseProviderItem = {
  suite: 'TestSuite1' | 'TestSuite2';
  caseName: string;
  loopIndex?: number;
  steps: readonly string[]; // 关键修改：使用只读数组，避免与 as const 推导冲突
};

// “要跑哪些用例”的矩阵；使用 as const 让字面量更严格，便于类型检查
const CASE_MATRIX = [
  { suite: 'TestSuite1', caseName: 'Suite1_Case1', loopIndex: 1, stepsOrder: ['step1', 'step2', 'step3'] },
  { suite: 'TestSuite1', caseName: 'Suite1_Case1', loopIndex: 2, stepsOrder: ['step1', 'step2', 'step3'] },
  { suite: 'TestSuite2', caseName: 'Suite2_Case1', stepsOrder: ['step1', 'step2', 'step3'] },
  { suite: 'TestSuite2', caseName: 'Suite2_Case2', stepsOrder: ['step1', 'step2', 'step3', 'step4'] }
] as const;

export function CaseDataProvider(): CaseProviderItem[] {
  const dataCtx = getDataCtx();
  return CASE_MATRIX.map(m => {
    // 用 TestCtx 做一次“存在性校验”和上下文构建
    const testCtx = createTestCtx(dataCtx, m.suite, m.caseName, (m as any).loopIndex);
    return {
      suite: testCtx.suite,
      caseName: testCtx.caseName,
      // Suite1 才有 loopIndex
      ...(testCtx.suite === 'TestSuite1' ? { loopIndex: (testCtx as any).loopIndex } : {}),
      steps: m.stepsOrder // 类型为 readonly string[]，与上面的定义一致
    };
  });
}