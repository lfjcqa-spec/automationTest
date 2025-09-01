import sql from 'mssql';
import { dbConfig } from '../config/env';

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect({
      user: dbConfig.user,
      password: dbConfig.password,
      server: dbConfig.server,
      port: dbConfig.port,
      database: dbConfig.database,
      options: dbConfig.options,
    });
  }
  return pool;
}

export async function query(queryStr: string, params?: Record<string, any>) {
  const p = await getConnection(); // ✅ 修复调用
  const req = p.request();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      req.input(key, value);
    }
  }
  const result = await req.query(queryStr);
  return result.recordset;
}
