import { AppConfig } from './app.config';
import { SwaggerConfig } from './swagger.config';
import { RedisConfig } from './redis.config';
import { DataBaseConfig } from './database.config';
import { AuthConfig } from './auth.config';
import { LoggerConfig } from './logger.config';

export {
  AppConfig,
  SwaggerConfig,
  RedisConfig,
  DataBaseConfig,
  AuthConfig,
  LoggerConfig,
};

export const Configs = [
  AppConfig,
  SwaggerConfig,
  RedisConfig,
  DataBaseConfig,
  AuthConfig,
  LoggerConfig,
] as const;

import type { TAppConfig } from './app.config';
import type { TSwaggerConfig } from './swagger.config';
import type { TRedisConfig } from './redis.config';
import type { TDataBaseConfig } from './database.config';
import type { TAuthConfig } from './auth.config';
import type { TLoggerConfig } from './logger.config';

export type {
  TAppConfig,
  TSwaggerConfig,
  TRedisConfig,
  TDataBaseConfig,
  TAuthConfig,
  TLoggerConfig,
};

export interface ConfigMap {
  app: TAppConfig;
  swagger: TSwaggerConfig;
  redis: TRedisConfig;
  database: TDataBaseConfig;
  auth: TAuthConfig;
  logger: TLoggerConfig;
}
