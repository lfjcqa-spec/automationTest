import { TestContext } from './context';
import {
  startSuiteResult,
  finishSuiteResult,
  startCaseResult,
  finishCaseResult,
  startStepResult,
  finishStepResult,
} from '../db/resultRepository';

export const Fixtures = {
  async beforeSuite(suite: any, ctx: TestContext) {
    ctx.currentSuite = suite.SuiteName;
    ctx.executionNo = ctx.executionNo || Date.now();

    await startSuiteResult({
      executionNo: ctx.executionNo,
      suiteName: suite.SuiteName,
      browserType: suite.BrowserType || 'chromium',
      startedAt: new Date(),
    });
  },

  async afterSuite(suite: any, ctx: TestContext, data: any) {
    await finishSuiteResult({
      executionNo: ctx.executionNo!,
      suiteName: suite.SuiteName,
      status: data.error ? 'failed' : 'passed',
      finishedAt: new Date(),
    });
  },

  async beforeCase(c: any, ctx: TestContext) {
    ctx.currentCase = c.CaseName;
    await startCaseResult({
      executionNo: ctx.executionNo!,
      suiteName: ctx.currentSuite!,
      caseName: c.CaseName,
      startedAt: new Date(),
    });
  },

  async afterCase(c: any, ctx: TestContext, data: any) {
    await finishCaseResult({
      executionNo: ctx.executionNo!,
      suiteName: ctx.currentSuite!,
      caseName: c.CaseName,
      status: data.error ? 'failed' : 'passed',
      finishedAt: new Date(),
    });
  },

  async beforeStep(step: any, ctx: TestContext) {
    await startStepResult({
      executionNo: ctx.executionNo!,
      suiteName: ctx.currentSuite!,
      caseName: ctx.currentCase!,
      stepName: step.StepName,
    });
  },

  async afterStep(step: any, ctx: TestContext, data: any) {
    await finishStepResult({
      executionNo: ctx.executionNo!,
      suiteName: ctx.currentSuite!,
      caseName: ctx.currentCase!,
      stepName: step.StepName,
      status: data.status || 'passed',
      errorMessage: data.error,
    });
  },
};
