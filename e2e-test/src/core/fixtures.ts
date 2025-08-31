import { TestContext } from './context';
import { RunUnit } from './types';

export type Hook = (ctx: TestContext, unit?: RunUnit) => Promise<void> | void;

export const fixtures = {
  beforeSuite: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`开始 Suite: ${unit?.suite.name}`);
  }) as Hook,
  afterSuite: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`结束 Suite: ${unit?.suite.name}`);
  }) as Hook,
  beforeCase: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`开始 Case: ${unit?.testCase.name} (类别: ${unit?.testCase.category})`);
  }) as Hook,
  afterCase: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`结束 Case: ${unit?.testCase.name}`);
  }) as Hook,
  beforeStep: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`开始 Step ${unit?.step.ordinal}: ${unit?.step.name}`);
  }) as Hook,
  afterStep: (async (_ctx: TestContext, unit?: RunUnit) => {
    console.log(`结束 Step ${unit?.step.ordinal}: ${unit?.step.name}`);
  }) as Hook,
};
