// 中文说明：Step Fixture（步驟参数读取）
// - 提供 getStepParams：根据 stepName 返回参数数组（去掉 undefined）。
// - 提供 getStepRow：拼装一个“行记录”，便于调试或作为 DataProvider 产物。

import { TestCtx } from './testCtx.dp';

export function getStepParams(testCtx: TestCtx, stepName: string): string[] {
  const s = testCtx.indexByStepName.get(stepName);
  return s ? [s.param1, s.param2, s.param3].filter(Boolean) as string[] : [];
}

export function getStepRow(testCtx: TestCtx, stepName: string) {
  const params = getStepParams(testCtx, stepName);
  return {
    suite: testCtx.suite,
    caseName: testCtx.caseName,
    loopIndex: testCtx.suite === 'TestSuite1' ? testCtx.loopIndex : undefined,
    stepName,
    ...(params[0] && { param1: params[0] }),
    ...(params[1] && { param2: params[1] }),
    ...(params[2] && { param3: params[2] })
  };
}