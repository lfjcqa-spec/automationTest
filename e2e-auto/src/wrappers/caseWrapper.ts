import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { stepWrapper } from './stepWrapper';
import { getField } from '../core/utils';
import { startCaseResult, finishCaseResult } from '../db/resultRepository';
import { StepResult } from './types';

function getBrowserExecutable(browserType: string | undefined): string | undefined {
  if (!browserType) return undefined;
  switch (browserType.toLowerCase()) {
    case 'edge':
      return 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    case 'chrome':
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    default:
      return undefined;
  }
}

export async function caseWrapper(
  suite: any,
  kase: any,
  steps: any[],
  loop?: any,
  stepResults: StepResult[] = [],
  executionNo?: number,
) {
  const suiteName = getField(suite, ['SuiteName', 'Name'], 'unknown-suite');
  const caseName = getField(kase, ['CaseName', 'Name'], 'unknown-case');
  const browserType = suite.BrowserType || 'chromium';

  console.log(
    `👉 [CaseWrapper] Start Case: ${caseName} (Suite=${suiteName}, Browser=${browserType})`,
  );

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  // ---- Case 开始 ----
  await startCaseResult({
    executionNo: executionNo!,
    suiteName,
    caseName,
    startedAt: new Date(),
  });

  try {
    const executablePath = getBrowserExecutable(browserType);
    browser = await chromium.launch({ headless: false, executablePath });
    context = await browser.newContext();
    page = await context.newPage();

    for (const step of steps) {
      await stepWrapper(page, { ...step, ...loop }, stepResults, executionNo, suiteName, caseName);
    }

    // ---- Case 成功 ----
    await finishCaseResult({
      executionNo: executionNo!,
      suiteName,
      caseName,
      status: 'passed',
      finishedAt: new Date(),
    });
  } catch (err) {
    await finishCaseResult({
      executionNo: executionNo!,
      suiteName,
      caseName,
      status: 'failed',
      finishedAt: new Date(),
    });
    throw err;
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }

  console.log(`👉 [CaseWrapper] End Case: ${caseName}`);
  return stepResults;
}
