// src/dbAccessFacade.ts
import _ from 'lodash';
import { AppConfig } from './config/schema.js';
import { spGetCasesDesignJson } from './db/sp.js';
import {
  getSuites,
  getCasesBySuite,
  getStepsByCase,
  getParamDefsByStep,
  getDataSetsByCase,
  getDDValuesByDataSet,
  getKWValuesByStep,
} from './db/repositories.js';
import {
  SuiteModel,
  CaseModel,
  StepModel,
  DataSetModel,
  ParamKV,
  RunUnit,
  CaseCategory,
  SpDesignCase,
} from './core/types.js';

// 辅助：字符串转枚举
function toCaseCategory(s: string): CaseCategory {
  return s === 'DataDriven' ? CaseCategory.DataDriven : CaseCategory.KeywordDriven;
}

// ============== 存储过程路径：把 SP 输出映射为运行模型（使用虚拟 Id） ==============
function mapFromSp(cases: SpDesignCase[]): SuiteModel[] {
  const bySuite = _.groupBy(cases, (c) => c.suiteName || 'DefaultSuite');
  const suites: SuiteModel[] = [];

  let suiteIdSeq = 1;
  let caseIdSeq = 1;
  let stepIdSeq = 1;

  for (const [suiteName, caseArr] of Object.entries(bySuite)) {
    const caseModels: CaseModel[] = [];

    for (const c of caseArr) {
      const dsModels: DataSetModel[] = c.loops.map((lp) => ({
        id: lp.dataSetId,
        name: lp.groupName,
        ordinal: lp.loopIndex,
      }));

      // 以第一个 loop 的 steps 作为步骤模板（确定顺序与参数键集合）
      const firstLoopSteps = c.loops[0]?.steps ?? [];
      const stepModels: StepModel[] = firstLoopSteps.map((st, idx) => ({
        id: stepIdSeq++, // 虚拟 StepId
        ordinal: idx + 1,
        name: st.stepName,
        params: Object.keys(st.params || {}).map((k) => ({ key: k, value: undefined })),
      }));

      caseModels.push({
        id: caseIdSeq++,
        name: c.caseName,
        category: toCaseCategory(c.category),
        steps: stepModels,
        dataSets: dsModels,
      });
    }

    suites.push({
      id: suiteIdSeq++,
      name: suiteName,
      cases: caseModels,
    });
  }

  return suites;
}

// ============== 公开：从数据库读取 Suite/Case/Step 模型（SP 优先，回退逐表） ==============
export async function readModelFromDb(config: AppConfig): Promise<SuiteModel[]> {
  // 1) 先试存储过程
  try {
    const spCases = await spGetCasesDesignJson({
      suiteName: config.suiteFilter ?? null,
      categoryName: null,
      caseName: config.caseFilter ?? null,
    });
    if (spCases.length > 0) {
      return mapFromSp(spCases);
    }
  } catch (e) {
    console.warn('调用存储过程 sp_GetCasesDesignJson 失败，将回退逐表查询。错误：', e);
  }

  // 2) 回退：逐表查询并本地组装
  const suites = await getSuites(config.suiteFilter);
  const out: SuiteModel[] = [];
  for (const s of suites) {
    const cases = await getCasesBySuite(s.Id, config.caseFilter);
    const caseModels: CaseModel[] = [];

    for (const c of cases) {
      const stepsRows = await getStepsByCase(c.Id);
      const stepModels: StepModel[] = [];

      for (const step of stepsRows) {
        const defs = await getParamDefsByStep(step.Id);
        const params: ParamKV[] = defs.map((d) => ({ key: d.ParamKey, value: undefined }));
        stepModels.push({
          id: step.Id,
          ordinal: step.Ordinal,
          name: step.StepName,
          params,
        });
      }

      const dsRows = await getDataSetsByCase(c.Id);
      const dsModels: DataSetModel[] = dsRows.map((ds) => ({
        id: ds.Id,
        name: ds.Name ?? `Loop-${ds.Ordinal}`,
        ordinal: ds.Ordinal,
      }));

      caseModels.push({
        id: c.Id,
        name: c.Name,
        // 注意：这里用字符串对比得到字符串枚举
        category:
          (c as any)['CategoryName'] === 'DataDriven'
            ? CaseCategory.DataDriven
            : CaseCategory.KeywordDriven,
        steps: _.sortBy(stepModels, (x) => x.ordinal),
        dataSets: _.sortBy(dsModels, (x) => x.ordinal),
      });
    }

    out.push({ id: s.Id, name: s.Name, cases: caseModels });
  }
  return out;
}

// ============== 工具：值类型转换（逐表模式用） ==============
function cast(value: string | null | undefined, type: string | null | undefined) {
  if (value == null) return null;
  const t = (type || 'string').toLowerCase();
  try {
    switch (t) {
      case 'number':
        return Number(value);
      case 'bool':
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  } catch {
    return value;
  }
}

// ============== 公开：解析某个执行单元的参数（SP 已注入则直接返回） ==============
export async function resolveParamsForUnit(unit: RunUnit): Promise<Record<string, any>> {
  // 如果上层已经注入了参数（SP 模式），直接返回
  if (unit.params && Object.keys(unit.params).length > 0) return unit.params;

  const params: Record<string, any> = {};
  for (const kv of unit.step.params) params[kv.key] = undefined;

  // 统一用字符串枚举判断类别
  const cat = unit.testCase.category;

  if (cat === CaseCategory.DataDriven) {
    // DataDriven：按当前 DataSetId 获取键值
    if (!unit.dataSet?.id) return params;
    const rows = await getDDValuesByDataSet(unit.dataSet.id);
    for (const r of rows) params[r.ParamKey] = cast(r.ParamValue, r.ValueType);
    return params;
  }

  // KeywordDriven：优先匹配 DataSetId 的特定值；无则回退 DataSetId IS NULL 的默认值
  const rows = await getKWValuesByStep(unit.testCase.id, unit.step.id);
  const targetId = unit.dataSet?.id ?? null;
  const grouped: Record<string, { specific?: any; def?: any }> = {};
  for (const r of rows) {
    const v = cast(r.ParamValue, r.ValueType);
    const g = (grouped[r.ParamKey] ||= {});
    if (r.DataSetId == null) g.def = v; // 默认值
    if (r.DataSetId === targetId) g.specific = v; // 指定 DataSet 值
  }
  for (const [k, v] of Object.entries(grouped)) {
    params[k] = v.specific ?? v.def ?? params[k];
  }
  return params;
}

// ============== 公开：从 SP 结果中为指定 loop/step 取参数 ==============
export function pickParamsFromSp(
  spCase: SpDesignCase,
  loopIndex: number,
  stepName: string,
): Record<string, any> {
  const loop = spCase.loops.find((l) => l.loopIndex === loopIndex);
  const step = loop?.steps.find((s) => s.stepName === stepName);
  return (step?.params ?? {}) as Record<string, any>;
}
