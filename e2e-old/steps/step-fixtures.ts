import type { TestInfo } from '@playwright/test';
import type { StepFixtures } from './step-types';

/**
 * 基于 TestInfo 创建 step-level 工具（带报告附件）
 */
export function createStepFixtures(input: { testInfo: TestInfo; stepName: string }): {
  fixtures: StepFixtures;
  teardown: () => Promise<void> | void;
} {
  const { testInfo, stepName } = input;
  const startedAt = Date.now();

  const fixtures: StepFixtures = {
    startedAt,
    log: (...args: any[]) => {
      try {
        const s = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
        console.log(`[step-level][${stepName}] ${s}`);
      } catch {
        console.log(`[step-level][${stepName}] [log-serialize-error]`);
      }
    },
    attach: async (name: string, body: Buffer | string, contentType = 'text/plain') => {
      const data = typeof body === 'string' ? Buffer.from(body) : body;
      await testInfo.attach(name, { body: data, contentType });
      console.log(`[test-level][attach] step=${stepName} name=${name} bytes=${data.byteLength}`);
    }
  };

  const teardown = () => {
    const took = Date.now() - startedAt;
    console.log(`[step-level][teardown] step=${stepName} tookMs=${took}`);
  };

  return { fixtures, teardown };
}