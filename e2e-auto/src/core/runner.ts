import { test, Page } from '@playwright/test';
import { suiteWrapper } from '../wrappers/suiteWrapper';
import { caseWrapper } from '../wrappers/caseWrapper';
import { loopWrapper } from '../wrappers/loopWrapper';
import { stepWrapper } from '../wrappers/stepWrapper';
import {
  loadSuites,
  loadCases,
  loadDDCaseSteps,
  loadDDCaseData,
  loadKDCaseSteps,
} from '../db/repositories';
import { getField } from './utils';

/**
 * 执行所有 Suite/Case/Loop/Step
 * 并返回完整的层级结果
 */
export async function runAllSuites(page: Page) {
  const results: any[] = [];
  const suites = await loadSuites();

  console.log('🔹 Loaded Suites from DB:', suites);

  for (const suite of suites) {
    // Suite 名称兼容
    const suiteName = getField(suite, ['SuiteName', 'Name', 'name', 'suite_name'], 'unknown-suite');

    await test.step(`Suite: ${suiteName}`, async () => {
      console.log('👉 Running Suite:', suite);

      const suiteResult: any = { suite: suiteName, cases: [] };

      // Suite Id 兼容
      const cases = await loadCases(suite.Id || suite.SuiteId || suite.id);

      console.log(`🔹 Loaded Cases for Suite ${suiteName}:`, cases);

      for (const kase of cases) {
        const caseName = getField(kase, ['CaseName', 'Name', 'name', 'case_name'], 'unknown-case');

        await test.step(`Case: ${caseName}`, async () => {
          console.log('👉 Running Case:', kase);

          const caseResult: any = { case: caseName, steps: [] };

          if (kase.CaseCategory === 'DD') {
            const steps = await loadDDCaseSteps(caseName);
            const loops = await loadDDCaseData(caseName);

            console.log(`🔹 Loaded DD Steps for Case ${caseName}:`, steps);
            console.log(`🔹 Loaded Loops for Case ${caseName}:`, loops);

            for (const loop of loops) {
              const loopName = getField(
                loop,
                ['LoopName', 'Name', 'name', 'loop_name'],
                'unknown-loop',
              );

              await test.step(`Loop: ${loopName}`, async () => {
                console.log('👉 Running Loop:', loop);

                for (const step of steps) {
                  const stepName = getField(
                    step,
                    ['StepName', 'Name', 'name', 'step_name'],
                    'unknown-step',
                  );

                  await test.step(`Step: ${stepName}`, async () => {
                    console.log('👉 Running Step:', step);
                    await stepWrapper(page, {
                      ...step,
                      ...loop,
                      StepName: stepName,
                    });
                    caseResult.steps.push(stepName);
                  });
                }
              });
            }
          } else if (kase.CaseCategory === 'KD') {
            const steps = await loadKDCaseSteps(caseName);

            console.log(`🔹 Loaded KD Steps for Case ${caseName}:`, steps);

            for (const step of steps) {
              const stepName = getField(
                step,
                ['StepName', 'Name', 'name', 'step_name'],
                'unknown-step',
              );

              await test.step(`Step: ${stepName}`, async () => {
                console.log('👉 Running Step:', step);
                await stepWrapper(page, { ...step, StepName: stepName });
                caseResult.steps.push(stepName);
              });
            }
          }

          suiteResult.cases.push(caseResult);
        });
      }

      results.push(suiteResult);
    });
  }

  // ✅ 确保返回结果，避免 runner.spec.ts 报 void 错误
  return results;
}
