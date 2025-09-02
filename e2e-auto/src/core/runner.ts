import { test, Page } from '@playwright/test';
import { stepWrapper } from '../wrappers/stepWrapper';
import {
  loadSuites,
  loadCases,
  loadDDCaseSteps,
  loadDDCaseData,
  loadKDCaseSteps,
} from '../db/repositories';
import { getField } from './utils';
import { color } from './utils';

// 格式化 Step 日志（带颜色）
function formatStep(step: any): string {
  const parts: string[] = [];
  if (step.StepName) parts.push(color.yellow(`Step=${step.StepName}`));
  if (step.balance) parts.push(color.cyan(`balance=${step.balance}`));
  if (step.prodCode) parts.push(color.cyan(`prodCode=${step.prodCode}`));
  if (step.prodName) parts.push(color.cyan(`prodName=${step.prodName}`));
  if (step.prodSize) parts.push(color.cyan(`prodSize=${step.prodSize}`));
  if (step.numOfMenu) parts.push(color.cyan(`numOfMenu=${step.numOfMenu}`));
  if (step.name) parts.push(color.cyan(`user=${step.name}`));
  return parts.join(', ');
}

/**
 * 执行所有 Suite/Case/Loop/Step
 * 并返回完整的层级结果
 */
export async function runAllSuites(page: Page) {
  const results: any[] = [];
  const suites = await loadSuites();

  for (const suite of suites) {
    const suiteName = getField(suite, ['SuiteName', 'Name', 'name', 'suite_name'], 'unknown-suite');
    console.log(color.blue(`👉 Running Suite: ${suiteName}`));

    const suiteResult: any = { suite: suiteName, cases: [] };
    const cases = await loadCases(suite.Id || suite.SuiteId || suite.id);

    for (const kase of cases) {
      const caseName = getField(kase, ['CaseName', 'Name', 'name', 'case_name'], 'unknown-case');
      console.log(color.green(`👉 Running Case: ${caseName}`));

      const caseResult: any = { case: caseName, steps: [] };

      if (kase.CaseCategory === 'DD') {
        const steps = await loadDDCaseSteps(caseName);
        const loops = await loadDDCaseData(caseName);

        for (const loop of loops) {
          const loopName = getField(
            loop,
            ['LoopName', 'Name', 'name', 'loop_name'],
            'unknown-loop',
          );
          console.log(color.magenta(`👉 Running Loop: ${loopName}`));

          for (const step of steps) {
            const stepName = getField(
              step,
              ['StepName', 'Name', 'name', 'step_name'],
              'unknown-step',
            );

            await test.step(`Step: ${stepName}`, async () => {
              console.log(`   🔹 ${formatStep({ ...step, ...loop, StepName: stepName })}`);
              await stepWrapper(page, { ...step, ...loop, StepName: stepName });
              caseResult.steps.push(stepName);
            });
          }
        }
      } else if (kase.CaseCategory === 'KD') {
        const steps = await loadKDCaseSteps(caseName);
        console.log(color.gray(`🔹 Loaded KD Steps for Case ${caseName}`));

        for (const step of steps) {
          const stepName = getField(
            step,
            ['StepName', 'Name', 'name', 'step_name'],
            'unknown-step',
          );

          await test.step(`Step: ${stepName}`, async () => {
            console.log(`   🔹 ${formatStep({ ...step, StepName: stepName })}`);
            await stepWrapper(page, { ...step, StepName: stepName });
            caseResult.steps.push(stepName);
          });
        }
      }

      suiteResult.cases.push(caseResult);
    }

    results.push(suiteResult);
  }

  return results;
}
