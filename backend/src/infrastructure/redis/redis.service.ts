import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@/config';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClientType;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedisService.name);
    const redisConfig = this.configService.redis;
    this.logger.info(
      `Connecting to Redis at ${redisConfig.host}`,
      RedisService.name,
    );

    this.client = createClient({
      url: redisConfig.url,
      database: redisConfig.db || 0,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.info('Connected to Redis');
    });

    this.client.on('ready', () => {
      this.logger.info('Redis is ready');
    });

    this.client.connect().catch((err) => {
      this.logger.error('Failed to connect to Redis', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.info('Redis connection closed');
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key}`, error);
      throw error;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      this.logger.error(`Failed to get key ${key}`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}`, error);
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}`, error);
      throw error;
    }
  }
}
