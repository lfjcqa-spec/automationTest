import type { FullConfig, Suite, Reporter } from '@playwright/test/reporter';

class SimpleReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    console.log(`自定义报告器：将执行 ${suite.allTests().length} 个测试条目。`);
  }
  onEnd() {
    console.log('自定义报告器：执行结束');
  }
}

export default SimpleReporter;
