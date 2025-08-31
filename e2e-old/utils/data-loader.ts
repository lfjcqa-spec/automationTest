import fs from 'fs';
import path from 'path';

export function loadJsonRows<T = any>(relativePath: string): T[] {
  // 以项目根目录为基准，兼容从不同工作目录运行
  const cwd = process.cwd();
  const p = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(cwd, relativePath.replace(/^(\.\/)?/, ''));

  if (!fs.existsSync(p)) {
    throw new Error(`Data file not found: ${p}`);
  }
  const raw = fs.readFileSync(p, 'utf-8').trim();
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error('JSON root must be an array');
    }
    return data as T[];
  } catch (e: any) {
    throw new Error(`Failed to parse JSON data file: ${p}\n${e?.message || e}`);
  }
}