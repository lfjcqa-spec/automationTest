import sql from 'mssql';

//
// Suite
//
export async function startSuiteResult(result: {
  executionNo: number;
  suiteName: string;
  browserType: string;
  startedAt?: Date;
}) {
  const pool = await sql.connect(process.env.DB_CONN!);
  await pool
    .request()
    .input('ExecutionNo', result.executionNo)
    .input('SuiteName', result.suiteName)
    .input('BrowserType', result.browserType)
    .input('Status', 'running')
    .input('StartedAt', result.startedAt || new Date()).query(`
      INSERT INTO SuiteResults (ExecutionNo, SuiteName, BrowserType, Status, StartedAt)
      VALUES (@ExecutionNo, @SuiteName, @BrowserType, @Status, @StartedAt)
    `);
}

export async function finishSuiteResult(result: {
  executionNo: number;
  suiteName: string;
  status: string;
  finishedAt?: Date;
}) {
  const pool = await sql.connect(process.env.DB_CONN!);
  await pool
    .request()
    .input('ExecutionNo', result.executionNo)
    .input('SuiteName', result.suiteName)
    .input('Status', result.status)
    .input('FinishedAt', result.finishedAt || new Date()).query(`
      UPDATE SuiteResults
      SET Status = @Status, FinishedAt = @FinishedAt
      WHERE ExecutionNo = @ExecutionNo
        AND SuiteName = @SuiteName
    `);
}

//
// Case
//
export async function startCaseResult(result: {
  executionNo: number;
  suiteName: string;
  caseName: string;
  startedAt?: Date;
}) {
  const pool = await sql.connect(process.env.DB_CONN!);
  await pool
    .request()
    .input('ExecutionNo', result.executionNo)
    .input('SuiteName', result.suiteName)
    .input('CaseName', result.caseName)
    .input('Status', 'running')
    .input('StartedAt', result.startedAt || new Date()).query(`
      INSERT INTO CaseResults (ExecutionNo, SuiteName, CaseName, Status, StartedAt)
      VALUES (@ExecutionNo, @SuiteName, @CaseName, @Status, @StartedAt)
    `);
}

export async function finishCaseResult(result: {
  executionNo: number;
  suiteName: string;
  caseName: string;
  status: string;
  finishedAt?: Date;
}) {
  const pool = await sql.connect(process.env.DB_CONN!);
  await pool
    .request()
    .input('ExecutionNo', result.executionNo)
    .input('SuiteName', result.suiteName)
    .input('CaseName', result.caseName)
    .input('Status', result.status)
    .input('FinishedAt', result.finishedAt || new Date()).query(`
      UPDATE CaseResults
      SET Status = @Status, FinishedAt = @FinishedAt
      WHERE ExecutionNo = @ExecutionNo
        AND SuiteName = @SuiteName
        AND CaseName = @CaseName
    `);
}

//
// Step
//
export async function startStepResult(result: {
  executionNo: number;
  suiteName: string;
  caseName: string;
  stepName: string;
}) {
  const pool = await sql.connect(process.env.DB_CONN!);
  await pool
    .request()
    .input('ExecutionNo', result.executionNo)
    .input('SuiteName', result.suiteName)
    .input('CaseName', result.caseName)
    .input('StepName', result.stepName)
    .input('Status', 'running').query(`
      INSERT INTO StepResults (ExecutionNo, SuiteName, CaseName, StepName, Status)
      VALUES (@ExecutionNo, @SuiteName, @CaseName, @StepName, @Status)
    `);
}

export async function finishStepResult(result: {
  executionNo: number;
  suiteName: string;
  caseName: string;
  stepName: string;
  status: string;
  errorMessage?: string;
}) {
  const pool = await sql.connect(process.env.DB_CONN!);
  await pool
    .request()
    .input('ExecutionNo', result.executionNo)
    .input('SuiteName', result.suiteName)
    .input('CaseName', result.caseName)
    .input('StepName', result.stepName)
    .input('Status', result.status)
    .input('ErrorMessage', result.errorMessage || null).query(`
      UPDATE StepResults
      SET Status = @Status,
          ErrorMessage = @ErrorMessage
      WHERE ExecutionNo = @ExecutionNo
        AND SuiteName = @SuiteName
        AND CaseName = @CaseName
        AND StepName = @StepName
    `);
}
