// 中文说明：CDX（数据上下文）
// - 负责集中管理“原始数据”与“统一查询 API”。
// - 对上层隐藏 Suite1/2 的结构差异，提供 getCase/getLoop/getStep/getParams 方法。
// - 目前示例数据写在常量里；实际可以改为从 JSON/数据库读取。

export type SuiteName = 'TestSuite1' | 'TestSuite2';

export interface StepRecord {
  stepName: string;
  param1?: string;
  param2?: string;
  param3?: string;
}

export interface LoopRecord {
  loopIndex: number;
  steps: StepRecord[];
}

export interface CaseSuite1 {
  caseName: string;
  loops: LoopRecord[];
}

export interface CaseSuite2 {
  caseName: string;
  steps: StepRecord[];
}

export type Suite1Data = CaseSuite1[];
export type Suite2Data = CaseSuite2[];

// 暴露给外部的查询接口
export interface DataCtx {
  getCase(suite: SuiteName, caseName: string): CaseSuite1 | CaseSuite2 | undefined;
  getLoop(caseObj: CaseSuite1, loopIndex: number): LoopRecord | undefined;
  getStep(holder: { steps: StepRecord[] }, stepName: string): StepRecord | undefined;
  getParams(q: { suite: SuiteName; caseName: string; stepName: string; loopIndex?: number }): string[];
}

// 示例数据（你可替换为读取 JSON）
const suite1Json: Suite1Data = [
  {
    caseName: 'Suite1_Case1',
    loops: [
      {
        loopIndex: 1,
        steps: [
          { stepName: 'step1', param1: 'step1_param1_loop1', param2: 'step1_param2_loop1' },
          { stepName: 'step2', param1: 'step2_param1_loop1', param2: 'step2_param2_loop1' },
          { stepName: 'step3', param1: 'step3_param1_loop1', param2: 'step3_param2_loop1' }
        ]
      },
      {
        loopIndex: 2,
        steps: [
          { stepName: 'step1', param1: 'step1_param1_loop2', param2: 'step1_param2_loop2' },
          { stepName: 'step2', param1: 'step2_param1_loop2', param2: 'step2_param2_loop2' },
          { stepName: 'step3', param1: 'step3_param1_loop2', param2: 'step3_param2_loop2' }
        ]
      }
    ]
  }
];

const suite2Json: Suite2Data = [
  {
    caseName: 'Suite2_Case1',
    steps: [
      { stepName: 'step1', param1: 'case1_step1_param1', param2: 'case1_step1_param2', param3: 'case1_step1_param3' },
      { stepName: 'step2', param1: 'case1_step2_param1', param2: 'case1_step2_param2', param3: 'case1_step2_param3' },
      { stepName: 'step3', param1: 'case1_step3_param1', param2: 'case1_step3_param2', param3: 'case1_step3_param3' }
    ]
  },
  {
    caseName: 'Suite2_Case2',
    steps: [
      { stepName: 'step1', param1: 'case2_step1_param1', param2: 'case2_step1_param2' },
      { stepName: 'step2', param1: 'case2_step2_param1', param2: 'case2_step2_param2' },
      { stepName: 'step3', param1: 'case2_step3_param1', param2: 'case2_step3_param2' },
      { stepName: 'step4', param1: 'case2_step4_param1', param2: 'case2_step4_param2' }
    ]
  }
];

export function createDataCtx(
  suite1Data: Suite1Data = suite1Json,
  suite2Data: Suite2Data = suite2Json
): DataCtx {
  // 建索引：按 caseName 快速查找
  const idxSuite1 = new Map<string, CaseSuite1>();
  suite1Data.forEach(c => idxSuite1.set(c.caseName, c));

  const idxSuite2 = new Map<string, CaseSuite2>();
  suite2Data.forEach(c => idxSuite2.set(c.caseName, c));

  // 统一查询：按 suite+caseName 返回对应 case
  const getCase: DataCtx['getCase'] = (suite, caseName) =>
    suite === 'TestSuite1' ? idxSuite1.get(caseName) : suite === 'TestSuite2' ? idxSuite2.get(caseName) : undefined;

  // Suite1 专用：按 loopIndex 找循环
  const getLoop: DataCtx['getLoop'] = (caseObj, loopIndex) =>
    caseObj?.loops?.find(l => l.loopIndex === loopIndex);

  // 通用：在 steps 数组里找特定 step
  const getStep: DataCtx['getStep'] = (holder, stepName) =>
    holder?.steps?.find(s => s.stepName === stepName);

  // 高阶封装：直接返回指定 step 的参数数组
  const getParams: DataCtx['getParams'] = ({ suite, caseName, stepName, loopIndex }) => {
    if (suite === 'TestSuite1') {
      const c = getCase('TestSuite1', caseName) as CaseSuite1 | undefined;
      if (!c || typeof loopIndex !== 'number') return [];
      const loop = getLoop(c, loopIndex);
      const st = loop && getStep(loop, stepName);
      return st ? [st.param1, st.param2, st.param3].filter(Boolean) as string[] : [];
    }
    if (suite === 'TestSuite2') {
      const c = getCase('TestSuite2', caseName) as CaseSuite2 | undefined;
      const st = c && getStep(c, stepName);
      return st ? [st.param1, st.param2, st.param3].filter(Boolean) as string[] : [];
    }
    return [];
  };

  return { getCase, getLoop, getStep, getParams };
}

// 提供一个 worker-scope 简单单例，避免多次构建数据上下文
let singleton: DataCtx | null = null;
export function getDataCtx(): DataCtx {
  if (!singleton) singleton = createDataCtx();
  return singleton;
}