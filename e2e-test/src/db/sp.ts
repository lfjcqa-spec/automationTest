// src/db/sp.ts
// 中文：调用存储过程 dbo.sp_GetCasesDesignJson，一次性获取完整的设计 JSON
import { getPool } from './sql.js';
import { SpDesignCase } from '../core/types.js';

export async function spGetCasesDesignJson(opts: {
  suiteName?: string | null;
  categoryName?: 'DataDriven' | 'KeywordDriven' | null;
  caseName?: string | null;
}): Promise<SpDesignCase[]> {
  const pool = await getPool();
  const request = pool.request();
  request.input('suiteName', opts.suiteName ?? null);
  request.input('categoryName', opts.categoryName ?? null);
  request.input('caseName', opts.caseName ?? null);

  // 存储过程返回一列 CasesJson，内容是 JSON 字符串（数组）
  const result = await request.execute('dbo.sp_GetCasesDesignJson');
  const row = result.recordset?.[0];
  if (!row) return [];
  const json = row.CasesJson as string | null;
  if (!json) return [];
  return JSON.parse(json) as SpDesignCase[];
}
