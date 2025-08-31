import fs from 'node:fs';
import path from 'node:path';
import { ConfigSchema, AppConfig } from './schema';

function readJson(p: string) {
  const exists = fs.existsSync(p);
  console.log(`Checking file: ${p}, exists: ${exists}`); // 调试信息
  return exists ? JSON.parse(fs.readFileSync(p, 'utf-8')) : {};
}

export function loadConfig(): AppConfig {
  const cwd = process.cwd();
  console.log(`Current working directory: ${cwd}`); // 调试工作目录
  const root = path.resolve(cwd, 'conf');
  const base = readJson(path.join(root, 'default.json'));
  const envName = process.env.ENV || 'dev';
  console.log(`Environment: ${envName}`); // 调试环境
  const envFile = readJson(path.join(root, `env.${envName}.json`));
  const merged = {
    ...{
      appUrl: 'https://www.google.com',
      login: { username: 'demo', password: 'demo123' },
      browser: { headless: true, slowMo: 0 },
    },
    ...base,
    ...envFile,
  };
  console.log(`Merged config:`, merged); // 调试合并结果
  return ConfigSchema.parse(merged);
}
