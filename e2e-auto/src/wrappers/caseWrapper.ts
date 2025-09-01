import { test } from '@playwright/test';

export async function caseWrapper(
  caseName: string,
  fn: () => Promise<void>,
  options?: {
    beforeCase?: (caseName: string) => Promise<void> | void;
    afterCase?: (caseName: string, error?: Error) => Promise<void> | void;
  },
) {
  return await test.step(`Case: ${caseName}`, async () => {
    if (options?.beforeCase) {
      await options.beforeCase(caseName);
    }

    let error: Error | undefined;
    try {
      await fn();
    } catch (err: any) {
      error = err;
      throw err;
    } finally {
      if (options?.afterCase) {
        await options.afterCase(caseName, error);
      }
    }
  });
}
