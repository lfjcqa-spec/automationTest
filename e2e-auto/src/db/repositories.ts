// 中文：数据访问层（纯 SQL 查询，不使用存储过程）
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

export async function getSuites(suiteFilter?: string | null): Promise<DbSuite[]> {
  if (suiteFilter) {
    const res = await query<DbSuite>`
      SELECT Id, Name FROM dbo.Suites WHERE Name = N'${suiteFilter}'
    `;
    return res.recordset;
  }
  const res = await query<DbSuite>`SELECT Id, Name FROM dbo.Suites`;
  return res.recordset;
}

export async function getCasesBySuite(
  suiteId: number,
  caseFilter?: string | null,
): Promise<(DbCase & { CategoryName: string })[]> {
  if (caseFilter) {
    const res = await query<DbCase & { CategoryName: string }>`
      SELECT c.Id, c.Name, c.CategoryId, c.SuiteId, cat.Name AS CategoryName
      FROM dbo.TestCases c
      JOIN dbo.TestCategories cat ON cat.Id = c.CategoryId
      WHERE c.SuiteId = ${suiteId} AND c.Name = N'${caseFilter}' AND c.IsActive = 1
    `;
    return res.recordset;
  }
  const res = await query<DbCase & { CategoryName: string }>`
    SELECT c.Id, c.Name, c.CategoryId, c.SuiteId, cat.Name AS CategoryName
    FROM dbo.TestCases c
    JOIN dbo.TestCategories cat ON cat.Id = c.CategoryId
    WHERE c.SuiteId = ${suiteId} AND c.IsActive = 1
    ORDER BY c.Id
  `;
  return res.recordset;
}

export async function getStepsByCase(caseId: number): Promise<DbStep[]> {
  const res = await query<DbStep>`
    SELECT Id, CaseId, Ordinal, StepName
    FROM dbo.TestSteps
    WHERE CaseId = ${caseId}
    ORDER BY Ordinal ASC
  `;
  return res.recordset;
}

export async function getParamDefsByStep(stepId: number): Promise<DbParamDef[]> {
  const res = await query<DbParamDef>`
    SELECT Id, StepId, ParamKey, ParamOrder
    FROM dbo.StepParamDefs
    WHERE StepId = ${stepId}
    ORDER BY ParamOrder, ParamKey
  `;
  return res.recordset;
}

export async function getDataSetsByCase(caseId: number): Promise<DbDataSet[]> {
  const res = await query<DbDataSet>`
    SELECT Id, CaseId, Name, Ordinal
    FROM dbo.DataSets
    WHERE CaseId = ${caseId}
    ORDER BY Ordinal ASC
  `;
  return res.recordset;
}

export async function getDDValuesByDataSet(dataSetId: number): Promise<DbDDValue[]> {
  const res = await query<DbDDValue>`
    SELECT Id, DataSetId, ParamKey, ParamValue, ValueType
    FROM dbo.DataDrivenValues
    WHERE DataSetId = ${dataSetId}
  `;
  return res.recordset;
}

export async function getKWValuesByStep(caseId: number, stepId: number): Promise<DbKWValue[]> {
  const res = await query<DbKWValue>`
    SELECT Id, CaseId, StepId, DataSetId, ParamKey, ParamValue, ValueType
    FROM dbo.KeywordStepValues
    WHERE CaseId = ${caseId} AND StepId = ${stepId}
  `;
  return res.recordset;
}
