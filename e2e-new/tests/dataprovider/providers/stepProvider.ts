// 中文说明：StepDataProvider（步驟级）
// - 在 CASE_MATRIX 的基础上展开成“每个步驟一行”的数据。
// - 这里不需要把 stepsOrder 暴露出去，但会读取其中的只读数组进行遍历。

import { getDataCtx } from '../fixtures/dataCtx.dp';
import { createTestCtx } from '../fixtures/testCtx.dp';

export type StepProviderItem = {
  suite: 'TestSuite1' | 'TestSuite2';
  caseName: string;
  loopIndex?: number;
  stepName: string;
  param1?: string;
  param2?: string;
  param3?: string;
};

// 同样使用 as const，stepsOrder 会被推导为只读数组（遍历不受影响）
const CASE_MATRIX = [
  { suite: 'TestSuite1', caseName: 'Suite1_Case1', loopIndex: 1, stepsOrder: ['step1', 'step2', 'step3'] },
  { suite: 'TestSuite1', caseName: 'Suite1_Case1', loopIndex: 2, stepsOrder: ['step1', 'step2', 'step3'] },
  { suite: 'TestSuite2', caseName: 'Suite2_Case1', stepsOrder: ['step1', 'step2', 'step3'] },
  { suite: 'TestSuite2', caseName: 'Suite2_Case2', stepsOrder: ['step1', 'step2', 'step3', 'step4'] }
] as const;

export function StepDataProvider(): StepProviderItem[] {
  const dataCtx = getDataCtx();
  const rows: StepProviderItem[] = [];
  for (const m of CASE_MATRIX) {
    const testCtx = createTestCtx(dataCtx, m.suite, m.caseName, (m as any).loopIndex);
    for (const stepName of m.stepsOrder) {
      const s = testCtx.indexByStepName.get(stepName);
      rows.push({
        suite: testCtx.suite,
        caseName: testCtx.caseName,
        ...(testCtx.suite === 'TestSuite1' ? { loopIndex: (testCtx as any).loopIndex } : {}),
        stepName,
        ...(s?.param1 ? { param1: s.param1 } : {}),
        ...(s?.param2 ? { param2: s.param2 } : {}),
        ...(s?.param3 ? { param3: s.param3 } : {})
      });
    }
  }
  return rows;
}