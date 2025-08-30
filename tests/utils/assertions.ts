import { expect } from '@playwright/test';

export const assertTruthy = async (value: any, message?: string) => {
  expect(Boolean(value), message ?? 'Expected truthy value').toBe(true);
};