import sql from 'mssql';

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (poolPromise) return poolPromise;
  const url = process.env.SQLSERVER_URL ?? '';
  if (!url) throw new Error('SQLSERVER_URL is not set. Please set it in conf/.env');
  poolPromise = new sql.ConnectionPool(url).connect();
  return poolPromise;
}

export async function query<T = any>(strings: TemplateStringsArray, ...values: any[]) {
  const pool = await getPool();
  const text = String.raw({ raw: strings as unknown as readonly string[] }, ...values);
  return pool.request().query<T>(text);
}
