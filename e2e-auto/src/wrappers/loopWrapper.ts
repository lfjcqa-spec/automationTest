import { test } from '@playwright/test';

export async function loopWrapper(
  loopName: string,
  loopData: any,
  fn: () => Promise<void>,
  options?: {
    beforeLoop?: (loopName: string, data: any) => Promise<void> | void;
    afterLoop?: (loopName: string, data: any, error?: Error) => Promise<void> | void;
  },
) {
  return await test.step(`Loop: ${loopName}`, async () => {
    if (options?.beforeLoop) {
      await options.beforeLoop(loopName, loopData);
    }

    let error: Error | undefined;
    try {
      await fn();
    } catch (err: any) {
      error = err;
      throw err;
    } finally {
      if (options?.afterLoop) {
        await options.afterLoop(loopName, loopData, error);
      }
    }
  });
}
