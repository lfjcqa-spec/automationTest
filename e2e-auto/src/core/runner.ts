import { caseWrapper } from '../wrappers/caseWrapper';
import {
  loadSuites,
  loadCases,
  loadDDCaseSteps,
  loadDDCaseData,
  loadKDCaseSteps,
} from '../db/repositories';
import { getField, color } from './utils';
import { startSuiteResult, finishSuiteResult } from '../db/resultRepository';

export async function runAllSuites() {
  const executionNo = Date.now();
  const results: any[] = [];
  const suites = await loadSuites();

  for (const suite of suites) {
    const suiteName = getField(suite, ['SuiteName', 'Name'], 'unknown-suite');
    const browserType = suite.BrowserType || 'chromium';

    console.log(
      color.blue(`👉 Running Suite: ${suiteName} (Browser=${browserType}, Exec=${executionNo})`),
    );

    // ---- Suite 开始 ----
    await startSuiteResult({
      executionNo,
      suiteName,
      browserType,
      startedAt: new Date(),
    });

    const suiteResult: any = { suite: suiteName, browserType, cases: [] };

    try {
      const cases = await loadCases(suite.Id || suite.SuiteId);
      for (const kase of cases) {
        const caseName = getField(kase, ['CaseName', 'Name'], 'unknown-case');
        console.log(color.green(`👉 Running Case: ${caseName}`));

        const caseResult: any = { case: caseName, steps: [] };

        if (kase.CaseCategory === 'DD') {
          const steps = await loadDDCaseSteps(caseName);
          const loops = await loadDDCaseData(caseName);
          for (const loop of loops) {
            await caseWrapper(suite, kase, steps, loop, caseResult.steps, executionNo);
          }
        } else if (kase.CaseCategory === 'KD') {
          const steps = await loadKDCaseSteps(caseName);
          await caseWrapper(suite, kase, steps, undefined, caseResult.steps, executionNo);
        }

        suiteResult.cases.push(caseResult);
      }

      // ---- Suite 成功 ----
      await finishSuiteResult({
        executionNo,
        suiteName,
        status: 'passed',
        finishedAt: new Date(),
      });
    } catch (err) {
      // ---- Suite 失败 ----
      await finishSuiteResult({
        executionNo,
        suiteName,
        status: 'failed',
        finishedAt: new Date(),
      });
      throw err;
    }

    results.push(suiteResult);
  }

  return results;
}
