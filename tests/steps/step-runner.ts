// tests/steps/step-runner.ts
// 可擴展執行器：同時支援「3 參數簡潔版」與「Options 物件版」。
// 目標：讓每個步驟在 HTML 報告的附件列表中按自然時間順序排列：pre(100) → log(200) → 自定義(500) → after(900)

import { test as base } from '@playwright/test';
import type { Step, StepContext, StepApi, RunStepsOptions, StepLogger } from './step-types';

type PlaywrightTest = typeof base;

// 保障 logger 完整性，缺省時回退到 console
function ensureLogger(logger?: StepLogger): Required<StepLogger> {
  return {
    info: logger?.info || ((msg) => console.log(msg)),
    warn: logger?.warn || ((msg) => console.warn(msg)),
    error: logger?.error || ((msg) => console.error(msg)),
  };
}

// 向測試附件注入文本（簡化封裝）
async function attachText(testInfo: any, name: string, body: string, contentType = 'text/plain') {
  if (!testInfo) return;
  await testInfo.attach(name, { body, contentType });
}

// 核心執行實作（統一進入點）
async function runStepsCore(opts: RunStepsOptions) {
  const {
    test,
    steps,
    ctx,
    meta,
    hooks,
    stepTitle,
    attachments = { pre: true, logs: true, after: true },
    logger: extLogger
  } = opts;

  const logger = ensureLogger(extLogger);
  const testInfo = ctx.testInfo || (test.info ? test.info() : undefined);
  const data = ctx.data;

  for (let i = 0; i < steps.length; i++) {
    const def = steps[i];
    const title = stepTitle ? stepTitle(def, i) : (def.title || def.name || `step-${i + 1}`);

    await test.step(title, async () => {
      const startedAt = Date.now();

      // PRE（100-）
      const preLine = `[STEP PRE] ${title}`;
      logger.info?.(preLine, { meta, index: i, name: def.name });
      if (attachments.pre) await attachText(testInfo, `100-pre-${title}.txt`, preLine);

      // 注入步骤 API：log / attach
      const stepApi: StepApi = {
        startedAt,
        log: async (line: string) => {
          // LOG（200-）
          const stamped = `${new Date().toISOString()} ${line}`;
          logger.info?.(stamped, { meta, index: i, name: def.name });
          if (attachments.logs) await attachText(testInfo, `200-log-${title}.txt`, stamped);
        },
        attach: async (name: string, body: string | Buffer, contentType = 'text/plain') => {
          // 自定義附件：若未帶排序前綴（100/200/500/900），則自動加 500-
          if (!testInfo) return;
          const hasPrefix = /^(100|200|500|900)-/.test(name);
          const prefixedName = hasPrefix ? name : `500-${name}`;
          await testInfo.attach(`${title}-${prefixedName}`, {
            body: typeof body === 'string' ? body : Buffer.from(body),
            contentType
          });
        }
      };

      let error: unknown;
      try {
        // Hook：每步之前
        if (hooks?.beforeEachStep) await hooks.beforeEachStep({ index: i, step: def, ctx });

        // 真正執行用例步驟
        await def.run({ ...ctx, step: stepApi, data });
      } catch (e) {
        error = e;
        throw e;
      } finally {
        // AFTER（900-）
        const afterLine = `[STEP AFTER] ${title}`;
        logger.info?.(afterLine, { meta, index: i, name: def.name, error: !!error });
        if (attachments.after) await attachText(testInfo, `900-after-${title}.txt`, afterLine);

        // Hook：每步之後
        if (hooks?.afterEachStep) await hooks.afterEachStep({ index: i, step: def, ctx, error });
      }
    });
  }
}

// 對外 API 1：簡潔三參數（向後相容）
export async function runSteps(test: PlaywrightTest, steps: Step[], ctx: StepContext) {
  await runStepsCore({ test, steps, ctx });
}

// 對外 API 2：擴展物件參數（建議在新代碼中採用）
export async function runStepsEx(options: RunStepsOptions) {
  await runStepsCore(options);
}