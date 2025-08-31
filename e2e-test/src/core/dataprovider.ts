// 中文：Case 级 Provider —— 每个 Test Case 在一个 Playwright test 中顺序执行 Steps，并对 DataDriven 的 DataSet 做循环
import _ from 'lodash';
import { SuiteModel, CaseModel, RunUnit } from './types.js';

export interface CaseRunUnit {
  suiteName: string; // Suite 名称
  caseModel: CaseModel; // 该测试用例模型（含 steps + dataSets）
}

// 针对单个 Suite，按“Case 为单位”产出运行单元
export function buildCaseProvidersForSuite(suite: SuiteModel): CaseRunUnit[] {
  const units: CaseRunUnit[] = suite.cases.map((c) => ({
    suiteName: suite.name,
    caseModel: c,
  }));
  // 按 Case 名称排序，便于阅读
  return _.sortBy(units, (u) => u.caseModel.name);
}

// 对多个 Suite 做聚合
export function buildCaseProvidersForAllSuites(suites: SuiteModel[]): CaseRunUnit[] {
  const all: CaseRunUnit[] = [];
  for (const s of suites) {
    all.push(...buildCaseProvidersForSuite(s));
  }
  // 按 Suite → Case 排序
  return _.sortBy(all, (u) => [u.suiteName, u.caseModel.name]);
}
