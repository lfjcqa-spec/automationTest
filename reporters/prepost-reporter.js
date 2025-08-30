// reporters/prepost-reporter.js
// 目标：在“测试详情 → Attachments”中以时间线排序展示：
//   000-pre-suite → 010-pre-test → (步骤们 100/200/500/900) → 980-after-test → 990-after-suite
// 说明：
//   - 由于 Playwright HTML 报告的附件是按“文件名字典序”展示，我们使用“三位数零填充”的数字前缀来锁定顺序。
//   - pre suite / after suite 属于 run 级别信息。为了在每个测试页可见：
//     * pre suite：在 onTestEnd 复制到每个测试里（000-pre-suite.txt）。
//     * after suite：只有“最后一个结束的测试”会带（990-after-suite.txt）。
//       如果你希望每个测试都显示 after suite，可在 onTestEnd 无条件插入一个占位版本（见下方注释）。
//   - 仍然把 SUITE 的 begin/end 写到报告目录的 .global-attachments（首页右上角 Attachments 可见）。
//
// 使用提示：
//   - 搭配 step-runner 的三位数前缀（100/200/500/900），整体顺序最稳。
//   - 修改后建议删除 playwright-report 与 test-results 再重跑，以避免旧产物干扰展示顺序。

const fs = require('fs');
const path = require('path');

class PrePostReporter {
  constructor(options = {}) {
    this.options = options;

    // 运行期日志
    this.stream = null;          // 文件写入流
    this.logDir = null;          // 运行日志目录

    // HTML 报告的全局附件目录（首页右上角）
    this.globalAttachDir = null;

    // 缓存 SUITE 开始/结束文本（用于复制到测试附件中）
    this.cachedSuiteBeginText = '';
    this.cachedSuiteEndText = '';

    // 缓存每个测试的“测试开始”文本（在 onTestEnd 再注入）
    this.testBeginText = new Map(); // Map<test.id, string>

    // 统计用：总测试数与已结束数（用于判断“最后一个结束的测试”）
    this.totalTests = 0;
    this.finishedTests = 0;
  }

  // 确保目录存在
  _ensureDir(dir) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }

  // 解析 HTML 报告目录（支持 html 报告自定义输出目录）
  _reportDir(config) {
    let reportDir = path.join(process.cwd(), 'playwright-report');
    for (const r of config.reporter || []) {
      if (Array.isArray(r) && r[0] === 'html') {
        const opts = r[1] || {};
        if (opts.outputFolder) {
          reportDir = path.isAbsolute(opts.outputFolder)
            ? opts.outputFolder
            : path.join(process.cwd(), opts.outputFolder);
        }
      }
    }
    return reportDir;
  }

  // 双写控制台与运行日志文件
  _w(line) {
    const out = `${new Date().toISOString()} ${line}\n`;
    process.stdout.write(out);
    if (this.stream) this.stream.write(out);
  }

  // Run 开始：初始化日志目录、全局附件目录；写 suite-begin.txt；缓存 SUITE:BEGIN 文本
  onBegin(config, rootSuite) {
    const outputDir = config.outputDir || path.join(process.cwd(), 'test-results');
    this.logDir = this.options.logDir
      ? (path.isAbsolute(this.options.logDir) ? this.options.logDir : path.join(process.cwd(), this.options.logDir))
      : path.join(outputDir, 'logs');

    const reportDir = this._reportDir(config);
    this.globalAttachDir = path.join(reportDir, '.global-attachments');

    this._ensureDir(this.logDir);
    this._ensureDir(this.globalAttachDir);

    const runLog = path.join(this.logDir, `run-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
    this.stream = fs.createWriteStream(runLog, { flags: 'a' });

    // 统计总测试数（用于定位“最后一个结束的测试”）
    this.totalTests = rootSuite.allTests().length;

    const line = `[SUITE:BEGIN] totalTests=${this.totalTests}`;
    this.cachedSuiteBeginText = `${new Date().toISOString()} ${line}\n`;
    this._w(line);

    // 首页右上角（run 级别）附件：suite-begin.txt
    fs.writeFileSync(path.join(this.globalAttachDir, 'suite-begin.txt'), this.cachedSuiteBeginText);
  }

  // Run 结束：写 suite-end.txt；缓存 SUITE:END 文本
  onEnd(result) {
    const line = `[SUITE:END] status=${result.status}`;
    this.cachedSuiteEndText = `${new Date().toISOString()} ${line}\n`;
    this._w(line);

    // 首页右上角（run 级别）附件：suite-end.txt
    this._ensureDir(this.globalAttachDir);
    fs.writeFileSync(path.join(this.globalAttachDir, 'suite-end.txt'), this.cachedSuiteEndText);

    if (this.stream) this.stream.end();
  }

  // Test 开始：缓存 TEST:BEGIN 文本
  onTestBegin(test) {
    const beginText = `${new Date().toISOString()} [TEST:BEGIN] ${test.titlePath().join(' > ')}\n`;
    this.testBeginText.set(test.id, beginText);
    this._w(`[TEST:BEGIN] ${test.title}`);
  }

  // Test 结束：按固定顺序向该测试注入附件（以内联 body 形式）
  onTestEnd(test, result) {
    const endText = `${new Date().toISOString()} [TEST:END] ${test.titlePath().join(' > ')} status=${result.status}\n`;
    this._w(`[TEST:END] ${test.title} status=${result.status}`);

    const beginText = this.testBeginText.get(test.id) || '';
    this.testBeginText.delete(test.id);

    result.attachments = result.attachments || [];

    // 1) 000-pre-suite（复制 SUITE:BEGIN）——必须第一个 push
    const preSuite = this.cachedSuiteBeginText || `${new Date().toISOString()} [SUITE:BEGIN] (unknown)\n`;
    result.attachments.push({
      name: '000-pre-suite.txt',
      contentType: 'text/plain',
      body: Buffer.from(preSuite)
    });

    // 2) 010-pre-test（TEST:BEGIN）——第二个 push
    result.attachments.push({
      name: '010-pre-test.txt',
      contentType: 'text/plain',
      body: Buffer.from(beginText)
    });

    // 步骤附件（100/200/500/900）由 tests/steps/step-runner.ts 产生，这里不做干预

    // 3) 980-after-test（TEST:END）——倒数第二
    result.attachments.push({
      name: '980-after-test.txt',
      contentType: 'text/plain',
      body: Buffer.from(endText)
    });

    // 4) 990-after-suite（SUITE:END 的复制件）——仅“最后一个结束的测试”包含
    this.finishedTests = (this.finishedTests || 0) + 1;
    const isLastFinished = this.finishedTests === this.totalTests;
    if (isLastFinished) {
      // 如果 onEnd 还未来得及生成 cachedSuiteEndText，则给一个占位文本，避免缺失
      const afterSuiteText = this.cachedSuiteEndText ||
        `${new Date().toISOString()} [SUITE:END] (pending-run-end) testsFinished=${this.finishedTests}/${this.totalTests}\n`;

      result.attachments.push({
        name: '990-after-suite.txt',
        contentType: 'text/plain',
        body: Buffer.from(afterSuiteText)
      });
    }

    // 如果你希望“每个测试都显示 990-after-suite.txt”，把上面的 if(isLastFinished){...}
    // 改为无条件 push，并用占位文本：
    // const afterSuiteText = this.cachedSuiteEndText || `${new Date().toISOString()} [SUITE:END] pending...\n`;
    // result.attachments.push({ name: '990-after-suite.txt', contentType: 'text/plain', body: Buffer.from(afterSuiteText) });
  }

  // 步骤级日志（可选输出到控制台/文件）
  onStepBegin(test, result, step) {
    this._w(`[STEP:BEGIN] ${test.title} :: ${step.title}`);
  }

  onStepEnd(test, result, step) {
    this._w(`[STEP:END] ${test.title} :: ${step.title} status=${step.error ? 'failed' : 'ok'}`);
  }
}

module.exports = PrePostReporter;