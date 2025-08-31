import { query } from './sql';
import {
  DbSuite,
  DbCase,
  DbStep,
  DbParamDef,
  DbDataSet,
  DbDDValue,
  DbKWValue,
} from '../core/types';

export async function getSuites(suiteFilter: string | null | undefined): Promise<DbSuite[]> {
  if (suiteFilter) {
    return (await query<DbSuite>`SELECT Id, Name FROM dbo.Suites WHERE Name = ${suiteFilter}`)
      .recordset;
  }
  return (await query<DbSuite>`SELECT Id, Name FROM dbo.Suites`).recordset;
}

export async function getCasesBySuite(
  suiteId: number,
  caseFilter: string | null | undefined,
): Promise<(DbCase & { CategoryName: string })[]> {
  if (caseFilter) {
    return (
      await query<DbCase & { CategoryName: string }>`
      SELECT c.Id, c.Name, c.CategoryId, c.SuiteId, cat.Name AS CategoryName
      FROM dbo.TestCases c
      JOIN dbo.TestCategories cat ON cat.Id = c.CategoryId
      WHERE c.SuiteId = ${suiteId} AND c.Name = ${caseFilter}
    `
    ).recordset;
  }
  return (
    await query<DbCase & { CategoryName: string }>`
    SELECT c.Id, c.Name, c.CategoryId, c.SuiteId, cat.Name AS CategoryName
    FROM dbo.TestCases c
    JOIN dbo.TestCategories cat ON cat.Id = c.CategoryId
    WHERE c.SuiteId = ${suiteId}
  `
  ).recordset;
}

export async function getStepsByCase(caseId: number): Promise<DbStep[]> {
  return (
    await query<DbStep>`
    SELECT Id, CaseId, Ordinal, StepName
    FROM dbo.TestSteps
    WHERE CaseId = ${caseId}
    ORDER BY Ordinal ASC
  `
  ).recordset;
}

export async function getParamDefsByStep(stepId: number): Promise<DbParamDef[]> {
  return (
    await query<DbParamDef>`
    SELECT Id, StepId, ParamKey, ParamOrder
    FROM dbo.StepParamDefs
    WHERE StepId = ${stepId}
    ORDER BY ParamOrder, ParamKey
  `
  ).recordset;
}

export async function getDataSetsByCase(caseId: number): Promise<DbDataSet[]> {
  return (
    await query<DbDataSet>`
    SELECT Id, CaseId, Name, Ordinal
    FROM dbo.DataSets
    WHERE CaseId = ${caseId}
    ORDER BY Ordinal ASC
  `
  ).recordset;
}

export async function getDDValuesByDataSet(dataSetId: number): Promise<DbDDValue[]> {
  return (
    await query<DbDDValue>`
    SELECT Id, DataSetId, ParamKey, ParamValue, ValueType
    FROM dbo.DataDrivenValues
    WHERE DataSetId = ${dataSetId}
  `
  ).recordset;
}

export async function getKWValuesByStep(caseId: number, stepId: number): Promise<DbKWValue[]> {
  return (
    await query<DbKWValue>`
    SELECT Id, CaseId, StepId, DataSetId, ParamKey, ParamValue, ValueType
    FROM dbo.KeywordStepValues
    WHERE CaseId = ${caseId} AND StepId = ${stepId}
  `
  ).recordset;
}
