// src/config/env.ts
import config from 'config';
import { DbConfig } from './schema';

export interface EnvConfig {
  baseUrl: string;
}

// 读取 env 节点
export const envConfig = config.get<EnvConfig>('env');

// 读取 db 节点
export const dbConfig = config.get<DbConfig>('db');

// 当前环境变量（默认 dev）
export const ENV = process.env.ENV || 'dev';
