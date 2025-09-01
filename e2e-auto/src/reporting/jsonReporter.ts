// src/reporting/jsonReporter.ts
import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

class JsonReporter implements Reporter {
  private results: any[] = [];

  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.results.push({
      suite: test.parent?.parent?.title,
      case: test.parent?.title,
      name: test.title,
      status: result.status,
      duration: result.duration,
      error: result.error?.message,
    });
  }

  async onEnd(result: FullResult) {
    const outDir = path.resolve(process.cwd(), 'playwright-report');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.join(outDir, 'custom-report.json');
    fs.writeFileSync(outFile, JSON.stringify(this.results, null, 2), 'utf-8');
    console.log(`✅ Custom JSON report written to: ${outFile}`);
  }
}

export default JsonReporter;
