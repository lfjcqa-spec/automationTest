import { z } from 'zod';

export const ConfigSchema = z.object({
  appUrl: z.string().url(),
  login: z.object({ username: z.string(), password: z.string() }),
  browser: z.object({
    headless: z.boolean().default(true),
    slowMo: z.number().int().nonnegative().default(0),
    baseURL: z.string().optional(),
  }),
  suiteFilter: z.string().nullable().optional(),
  caseFilter: z.string().nullable().optional(),
  reportDir: z.string().default('playwright-report'),
  suiteData: z.array(z.object({ name: z.string(), envTag: z.string().optional() })).optional(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;
