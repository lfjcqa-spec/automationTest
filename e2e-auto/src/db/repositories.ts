// 中文：数据访问层（Repositories） —— 逐表查询（作为存储过程的回退方案）
// 注意：主流程优先使用 dbo.sp_GetCasesDesignJson（见 sp.ts 与 dbAccessFacade.ts）
import { query } from './sql.js';
import {
  DbSuite,
  DbCase,
  DbStep,
  DbParamDef,
  DbDataSet,
  DbDDValue,
  DbKWValue,
} from '../core/types.js';

// 按名称过滤 Suite；不传则返回全部
export async function getSuites(suiteFilter: string | null | undefined): Promise<DbSuite[]> {
  if (suiteFilter) {
    return await query<DbSuite>`
      SELECT Id, Name
      FROM dbo.Suites
      WHERE Name = ${suiteFilter}
    `;
  }
  return await query<DbSuite>`SELECT Id, Name FROM dbo.Suites`;
}

// 获取某个 Suite 下的 TestCases，并返回其类别名
export async function getCasesBySuite(
  suiteId: number,
  caseFilter: string | null | undefined,
): Promise<(DbCase & { CategoryName: string })[]> {
  if (caseFilter) {
    return await query<DbCase & { CategoryName: string }>`
      SELECT c.Id, c.Name, c.CategoryId, c.SuiteId, cat.Name AS CategoryName
      FROM dbo.TestCases c
      JOIN dbo.TestCategories cat ON cat.Id = c.CategoryId
      WHERE c.SuiteId = ${suiteId} AND c.Name = ${caseFilter}
    `;
  }
  return await query<DbCase & { CategoryName: string }>`
    SELECT c.Id, c.Name, c.CategoryId, c.SuiteId, cat.Name AS CategoryName
    FROM dbo.TestCases c
    JOIN dbo.TestCategories cat ON cat.Id = c.CategoryId
    WHERE c.SuiteId = ${suiteId}
  `;
}

// 获取指定 Case 的步骤（按 Ordinal 排序）
export async function getStepsByCase(caseId: number): Promise<DbStep[]> {
  return await query<DbStep>`
    SELECT Id, CaseId, Ordinal, StepName
    FROM dbo.TestSteps
    WHERE CaseId = ${caseId}
    ORDER BY Ordinal ASC
  `;
}

// 获取步骤的参数键定义（StepParamDefs）
export async function getParamDefsByStep(stepId: number): Promise<DbParamDef[]> {
  return await query<DbParamDef>`
    SELECT Id, StepId, ParamKey, ParamOrder
    FROM dbo.StepParamDefs
    WHERE StepId = ${stepId}
    ORDER BY ParamOrder, ParamKey
  `;
}

// 获取 Case 的所有 DataSet（DataDriven 循环）
export async function getDataSetsByCase(caseId: number): Promise<DbDataSet[]> {
  return await query<DbDataSet>`
    SELECT Id, CaseId, Name, Ordinal
    FROM dbo.DataSets
    WHERE CaseId = ${caseId}
    ORDER BY Ordinal ASC
  `;
}

// DataDriven：获取某个 DataSet 的键值
export async function getDDValuesByDataSet(dataSetId: number): Promise<DbDDValue[]> {
  return await query<DbDDValue>`
    SELECT Id, DataSetId, ParamKey, ParamValue, ValueType
    FROM dbo.DataDrivenValues
    WHERE DataSetId = ${dataSetId}
  `;
}

// KeywordDriven：获取某 Case+Step 下所有 KV（包含 DataSetId 为 NULL 与具体值）
export async function getKWValuesByStep(caseId: number, stepId: number): Promise<DbKWValue[]> {
  return await query<DbKWValue>`
    SELECT Id, CaseId, StepId, DataSetId, ParamKey, ParamValue, ValueType
    FROM dbo.KeywordStepValues
    WHERE CaseId = ${caseId} AND StepId = ${stepId}
  `;
}
