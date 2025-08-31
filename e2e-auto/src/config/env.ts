// 中文：读取 conf/default.json 与 conf/env.{ENV}.json，合并并校验
import fs from 'node:fs';
import path from 'node:path';
import { ConfigSchema, AppConfig } from './schema.js';

function readJson(p: string) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : {};
}

export function loadConfig(): AppConfig {
  const root = path.resolve(process.cwd(), 'conf');
  const base = readJson(path.join(root, 'default.json'));
  const envName = process.env.ENV || 'dev';
  const envFile = readJson(path.join(root, `env.${envName}.json`));
  const merged = { ...base, ...envFile };
  return ConfigSchema.parse(merged);
}
