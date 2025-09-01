import config from 'config';
import { EnvConfig, DbConfig } from './schema';

export const envConfig = config.get<EnvConfig>('env');
export const dbConfig = config.get<DbConfig>('db');
