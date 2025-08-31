// 中文说明：Test Fixture（用例级上下文）
// - 作用：基于 DataCtx，把“整库数据”裁切为“单个用例可直接使用的步驟索引”。
// - Suite1 需要 loopIndex；Suite2 不需要。
// - indexByStepName 让我们可以 O(1) 读取具体步驟的参数。

import { DataCtx, SuiteName, CaseSuite1, CaseSuite2, StepRecord } from './dataCtx.dp';

export type TestCtx =
  | { suite: 'TestSuite1'; caseName: string; loopIndex: number; indexByStepName: Map<string, StepRecord> }
  | { suite: 'TestSuite2'; caseName: string; indexByStepName: Map<string, StepRecord> };

export function createTestCtx(
  dataCtx: DataCtx,
  suite: SuiteName,
  caseName: string,
  loopIndex?: number
): TestCtx {
  if (suite === 'TestSuite1') {
    const c = dataCtx.getCase('TestSuite1', caseName) as CaseSuite1 | undefined;
    if (!c) throw new Error(`Case not found: ${suite}/${caseName}`);
    if (typeof loopIndex !== 'number') throw new Error(`loopIndex required for ${suite}/${caseName}`);
    const loop = dataCtx.getLoop(c, loopIndex);
    if (!loop) throw new Error(`Loop not found: ${suite}/${caseName}/loop=${loopIndex}`);
    const index = new Map(loop.steps.map(s => [s.stepName, s]));
    return { suite: 'TestSuite1', caseName, loopIndex, indexByStepName: index };
  } else {
    const c = dataCtx.getCase('TestSuite2', caseName) as CaseSuite2 | undefined;
    if (!c) throw new Error(`Case not found: ${suite}/${caseName}`);
    const index = new Map(c.steps.map(s => [s.stepName, s]));
    return { suite: 'TestSuite2', caseName, indexByStepName: index };
  }
}