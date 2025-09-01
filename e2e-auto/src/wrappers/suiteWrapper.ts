import { test } from '@playwright/test';

export async function suiteWrapper(
  suiteName: string,
  fn: () => Promise<void>,
  options?: {
    beforeSuite?: (suiteName: string) => Promise<void> | void;
    afterSuite?: (suiteName: string, error?: Error) => Promise<void> | void;
  },
) {
  return await test.step(`Suite: ${suiteName}`, async () => {
    if (options?.beforeSuite) {
      await options.beforeSuite(suiteName);
    }

    let error: Error | undefined;
    try {
      await fn();
    } catch (err: any) {
      error = err;
      throw err;
    } finally {
      if (options?.afterSuite) {
        await options.afterSuite(suiteName, error);
      }
    }
  });
}
