// 中文：自定义 Reporter（与内置 HTML 报告共存），主要用于控制台输出简要信息
import type { FullConfig, Suite, Reporter } from '@playwright/test/reporter';

class SimpleReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    console.log(
      `自定义报告器：将执行 ${
        suite.allTests().length
      } 个测试条目（每个条目对应一个或多个 Test Case 执行段）。`,
    );
  }
  onEnd() {
    console.log('自定义报告器：执行结束');
  }
}

export default SimpleReporter;
