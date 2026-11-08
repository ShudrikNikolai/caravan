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
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.info('Connected to Redis');
  }

  async onModuleDestroy() {
    if (!this.client.isOpen) {
      return;
    }

    await this.client.quit();
    this.logger.info('Redis connection closed');
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
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

  async get<T = unknown>(key: string): Promise<T | null> {
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

  async setNx(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      const result = ttl
        ? await this.client.set(key, serialized, { NX: true, EX: ttl })
        : await this.client.set(key, serialized, { NX: true });

      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to set NX key ${key}`, error);
      throw error;
    }
  }

  async zAdd(key: string, score: number, member: string): Promise<void> {
    try {
      await this.client.zAdd(key, { score, value: member });
    } catch (error) {
      this.logger.error(`Failed to add to sorted set ${key}`, error);
      throw error;
    }
  }

  async zRangeByScore(
    key: string,
    min: number,
    max: number,
  ): Promise<string[]> {
    try {
      return await this.client.zRangeByScore(key, min, max);
    } catch (error) {
      this.logger.error(`Failed to read sorted set ${key}`, error);
      throw error;
    }
  }

  async zRem(key: string, member: string): Promise<void> {
    try {
      await this.client.zRem(key, member);
    } catch (error) {
      this.logger.error(`Failed to remove from sorted set ${key}`, error);
      throw error;
    }
  }

  async zRevRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.zRange(key, start, stop, { REV: true });
    } catch (error) {
      this.logger.error(`Failed to read reversed sorted set ${key}`, error);
      throw error;
    }
  }

  async sAdd(key: string, member: string): Promise<void> {
    try {
      await this.client.sAdd(key, member);
    } catch (error) {
      this.logger.error(`Failed to add to set ${key}`, error);
      throw error;
    }
  }

  async sRem(key: string, member: string): Promise<void> {
    try {
      await this.client.sRem(key, member);
    } catch (error) {
      this.logger.error(`Failed to remove from set ${key}`, error);
      throw error;
    }
  }

  async sMembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      this.logger.error(`Failed to read set ${key}`, error);
      throw error;
    }
  }

  async sCard(key: string): Promise<number> {
    try {
      return await this.client.sCard(key);
    } catch (error) {
      this.logger.error(`Failed to read set size ${key}`, error);
      throw error;
    }
  }
}
