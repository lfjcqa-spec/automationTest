// 中文：配置的运行时校验 Schema（zod）
import { z } from 'zod';

export const ConfigSchema = z.object({
  appUrl: z.string().url(), // 应用入口 URL
  login: z.object({ username: z.string(), password: z.string() }),
  browser: z.object({
    headless: z.boolean().default(true),
    slowMo: z.number().int().nonnegative().default(0),
    baseURL: z.string().optional(),
  }),
  suiteFilter: z.string().nullable().optional(), // 过滤某个 Suite 名称
  caseFilter: z.string().nullable().optional(), // 过滤某个 Case 名称
  reportDir: z.string().default('playwright-report'), // 报告目录
  suiteData: z
    .array(
      z.object({
        name: z.string(),
        envTag: z.string().optional(),
      }),
    )
    .optional(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;
