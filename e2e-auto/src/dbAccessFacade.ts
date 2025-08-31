import _ from 'lodash';
import { AppConfig } from './config/schema.js';
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
} from './core/types.js';

// 辅助：值类型转换
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

// 读取 DB 并组装 Suite/Case/Step 模型（仅 SQL，不依赖存储过程）
export async function readModelFromDb(config: AppConfig): Promise<SuiteModel[]> {
  const suitesRows = await getSuites(config.suiteFilter ?? null);
  const out: SuiteModel[] = [];

  for (const s of suitesRows) {
    const casesRows = await getCasesBySuite(s.Id, config.caseFilter ?? null);
    const caseModels: CaseModel[] = [];

    for (const c of casesRows) {
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
      const dsModels: DataSetModel[] =
        dsRows.length > 0
          ? dsRows.map((ds) => ({
              id: ds.Id,
              name: ds.Name ?? `Loop-${ds.Ordinal}`,
              ordinal: ds.Ordinal,
            }))
          : [
              // 对 KeywordDriven：若没有定义 DataSet，则提供默认循环
              {
                id: null,
                name: 'Default',
                ordinal: 1,
              },
            ];

      caseModels.push({
        id: c.Id,
        name: c.Name,
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

// 解析某个执行单元的参数（从 DB 动态取值）
export async function resolveParamsForUnit(unit: RunUnit): Promise<Record<string, any>> {
  // 初始参数键集合
  const params: Record<string, any> = {};
  for (const kv of unit.step.params) params[kv.key] = undefined;

  const cat = unit.testCase.category;

  if (cat === CaseCategory.DataDriven) {
    // DataDriven：按当前 DataSetId 获取键值
    if (!unit.dataSet?.id) return params;
    const ddRows = await getDDValuesByDataSet(unit.dataSet.id);
    for (const r of ddRows) params[r.ParamKey] = cast(r.ParamValue, r.ValueType);
    return params;
  }

  // KeywordDriven：优先匹配 DataSetId 的特定值；无则回退 DataSetId IS NULL 的默认值
  const kwRows = await getKWValuesByStep(unit.testCase.id, unit.step.id);
  const targetId = unit.dataSet?.id ?? null;
  const grouped: Record<string, { specific?: any; def?: any }> = {};
  for (const r of kwRows) {
    const v = cast(r.ParamValue, r.ValueType);
    const g = (grouped[r.ParamKey] ||= {});
    if (r.DataSetId == null) g.def = v;
    if (r.DataSetId === targetId) g.specific = v;
  }
  for (const [k, v] of Object.entries(grouped)) {
    params[k] = v.specific ?? v.def ?? params[k];
  }
  return params;
}
