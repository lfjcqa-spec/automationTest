import _ from 'lodash';
import { AppConfig } from './config/schema';
import {
  getSuites,
  getCasesBySuite,
  getStepsByCase,
  getParamDefsByStep,
  getDataSetsByCase,
  getDDValuesByDataSet,
  getKWValuesByStep,
} from './db/repositories';
import {
  SuiteModel,
  CaseModel,
  StepModel,
  DataSetModel,
  ParamKV,
  RunUnit,
  CaseCategory,
} from './core/types';

function toCaseCategory(s: string): CaseCategory {
  return s === 'DataDriven' ? CaseCategory.DataDriven : CaseCategory.KeywordDriven;
}

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

export async function readModelFromDb(config: AppConfig): Promise<SuiteModel[]> {
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
        category: toCaseCategory(c.CategoryName),
        steps: _.sortBy(stepModels, (x) => x.ordinal),
        dataSets: _.sortBy(dsModels, (x) => x.ordinal),
      });
    }

    out.push({ id: s.Id, name: s.Name, cases: caseModels });
  }
  return out;
}

export async function resolveParamsForUnit(unit: RunUnit): Promise<Record<string, any>> {
  const params: Record<string, any> = {};
  for (const kv of unit.step.params) params[kv.key] = undefined;

  const cat = unit.testCase.category;

  if (cat === CaseCategory.DataDriven) {
    if (!unit.dataSet?.id) return params;
    const rows = await getDDValuesByDataSet(unit.dataSet.id);
    for (const r of rows) params[r.ParamKey] = cast(r.ParamValue, r.ValueType);
    return params;
  }

  const rows = await getKWValuesByStep(unit.testCase.id, unit.step.id);
  const targetId = unit.dataSet?.id ?? null;
  const grouped: Record<string, { specific?: any; def?: any }> = {};
  for (const r of rows) {
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
