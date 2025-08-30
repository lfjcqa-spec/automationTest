import { test as baseTest } from '@playwright/test';
import type { TestType, TestInfo } from '@playwright/test';
import type { Step, StepContext, StepPayload } from './step-types';
import { createStepFixtures } from './step-fixtures';

/**
 * 为兼容不同版本，把 test.step 回调的参数用宽松 StepLike 接受
 * 只用于日志，不调用 TestInfo 的能力
 */
type StepLike = {
  title?: string;
  category?: string;
  startTime?: number;
  duration?: number;
  error?: any;
  [k: string]: any;
};

function apacheLine(indentLevel: number, parts: (string | undefined)[]) {
  const indent = '  '.repeat(indentLevel);
  console.log(`${indent}${parts.filter(Boolean).join('    ')}`);
}

function log(prefix: string, obj: any) {
  try { console.log(prefix, JSON.stringify(obj)); } catch { console.log(prefix, String(obj)); }
}

/**
 * 运行步骤集合（用法 B）
 * - testInfo：test-level，上层传入；用于附件、输出路径等
 * - stepArg：step-level，来自 t.step 回调；仅用于日志
 */
export async function runSteps(
  t: TestType<any, any> = baseTest,
  steps: Step[],
  ctx: Omit<StepContext, 'step'>,
  dataRows?: StepPayload[],
  apacheHeader?: { suite: string; testCase: string },
  testInfo?: TestInfo
) {
  if (dataRows?.length) {
    for (const [i, row] of dataRows.entries()) {
      await t.step(`Data Row #${i + 1}`, async () => {
        console.log(`[step-level][row] index=${i + 1}`);
        if (apacheHeader) apacheLine(1, [`TestCase: ${apacheHeader.testCase}`]);
        await runOnce(t, steps, ctx as StepContext, row, 2, testInfo);
      });
    }
  } else {
    if (apacheHeader) apacheLine(1, [`TestCase: ${apacheHeader?.testCase}`]);
    await runOnce(t, steps, ctx as StepContext, {}, 2, testInfo);
  }
}

async function runOnce(
  t: TestType<any, any>,
  steps: Step[],
  ctx: StepContext,
  payload: StepPayload,
  apacheIndent: number,
  testInfo?: TestInfo // test-level
) {
  for (const s of steps) {
    await t.step(s.name, async (stepArg?: StepLike) => {
      // step-level：仅做日志演示
      if (stepArg) {
        const meta = {
          stepTitle: stepArg.title ?? s.name,
          startTime: stepArg.startTime,
          category: stepArg.category
        };
        console.log(`[step-level][meta]`, meta);
      }

      // 构建 step-level fixtures（若无 testInfo，降级为轻量实现）
      const useSF = s.useStepFixtures ?? true;
      let teardown: (() => Promise<void> | void) | undefined;

      if (useSF) {
        if (testInfo) {
          const pack = createStepFixtures({ testInfo, stepName: s.name }); // test-level 能力注入
          ctx.step = pack.fixtures;
          teardown = pack.teardown;
        } else {
          const startedAt = Date.now();
          ctx.step = {
            startedAt,
            log: (...args: any[]) => {
              try {
                const out = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a)));
                console.log(`[step-level][${s.name}]`, ...out);
              } catch {
                console.log(`[step-level][${s.name}] [log-serialize-error]`);
              }
            },
            attach: async () => {
              console.warn(`[step-level][${s.name}] attach skipped (no TestInfo)`);
            }
          };
          teardown = () => console.log(`[step-level][teardown] step=${s.name} tookMs=${Date.now() - startedAt}`);
        }
      }

      const start = Date.now();
      console.log(`[test-level][step-start] name=${s.name}`);

      try {
        if (s.before) await s.before(ctx, payload);
        await s.run(ctx, payload);
      } finally {
        if (s.after) await s.after(ctx, payload);
        if (teardown) await teardown();
        console.log(`[test-level][step-end] name=${s.name} tookMs=${Date.now() - start}`);
        apacheLine(apacheIndent, summarizeStepParams(s.name, payload));
        ctx.step = undefined; // 清理 step-level 引用
      }
    });
  }
}

function summarizeStepParams(stepName: string, payload: any): string[] {
  const p = payload || {};
  const keys = Object.keys(p);
  const values: string[] = [];
  for (const k of keys.slice(0, 4)) {
    const v = p[k];
    if (v !== undefined && v !== null) values.push(String(v));
  }
  const name = (p.stepName && String(p.stepName)) || stepName;
  return [name, ...values];
}