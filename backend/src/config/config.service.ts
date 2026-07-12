import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import {
  TAppConfig,
  TAuthConfig,
  TDataBaseConfig,
  TLoggerConfig,
  TRedisConfig,
  TSwaggerConfig,
  ConfigMap,
} from './configs';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get app(): TAppConfig {
    return this.getOrThrow('app');
  }

  get swagger(): TSwaggerConfig {
    return this.getOrThrow('swagger');
  }

  get redis(): TRedisConfig {
    return this.getOrThrow('redis');
  }

  get logger(): TLoggerConfig {
    return this.getOrThrow('logger');
  }

  get database(): TDataBaseConfig {
    return this.getOrThrow('database');
  }

  get auth(): TAuthConfig {
    return this.getOrThrow('auth');
  }

  get isDev(): boolean {
    return this.app.nodeEnv === 'development';
  }

  getOrThrow<K extends keyof ConfigMap>(propertyPath: K): ConfigMap[K] {
    return this.configService.getOrThrow(propertyPath);
  }
}
