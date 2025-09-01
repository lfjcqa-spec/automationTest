// src/db/repositories.ts
import { query } from './dbAccessFacade';

export async function loadSuites() {
  return await query(`
    SELECT Id, Name, IsActive
    FROM dbo.Suites
    WHERE IsActive=1
    ORDER BY Id
  `);
}

export async function loadCases(suiteId: number) {
  return await query(
    `SELECT Id, SuiteId, CaseCategory, CaseName, SortOrder
     FROM dbo.SuiteItems
     WHERE SuiteId=@suiteId
     ORDER BY SortOrder`,
    { suiteId },
  );
}

export async function loadDDCaseSteps(caseName: string) {
  return await query(
    `SELECT CaseName, Step, StepName
     FROM dbo.DDCase
     WHERE CaseName=@caseName
     ORDER BY Step`,
    { caseName },
  );
}

export async function loadDDCaseData(caseName: string) {
  return await query(
    `SELECT Id, CaseName, LoopOrdinal, LoopName, name, pwd, prodCode, prodName
     FROM dbo.DDCase_TestData
     WHERE CaseName=@caseName
     ORDER BY LoopOrdinal`,
    { caseName },
  );
}

export async function loadKDCaseSteps(caseName: string) {
  return await query(
    `SELECT Id, CaseName, Step, StepName,
            name, pwd, numOfMenu, balance, prodCode, prodName, prodSize
     FROM dbo.KDCase
     WHERE CaseName=@caseName
     ORDER BY Step`,
    { caseName },
  );
}
