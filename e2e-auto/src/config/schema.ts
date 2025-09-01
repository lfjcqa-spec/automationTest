export interface EnvConfig {
  baseUrl: string;
}

export interface DbConfig {
  user: string;
  password: string;
  server: string;
  port: number;
  database: string;
  options?: {
    encrypt?: boolean;
  };
}
