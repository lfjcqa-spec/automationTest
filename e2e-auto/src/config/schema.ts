// 中文：配置的运行时校验 Schema（zod）
import { z } from 'zod';

export const ConfigSchema = z.object({
  appUrl: z.string().url(), // 应用入口 URL
  login: z.object({
    username: z.string(),
    password: z.string(),
  }),
  browser: z
    .object({
      headless: z.boolean().default(true),
      slowMo: z.number().int().nonnegative().default(0),
      baseURL: z.string().optional(),
    })
    .default({ headless: true, slowMo: 0 }),
  suiteFilter: z.string().nullable().optional(),
  caseFilter: z.string().nullable().optional(),
  reportDir: z.string().default('playwright-report'),
});

export type AppConfig = z.infer<typeof ConfigSchema>;
