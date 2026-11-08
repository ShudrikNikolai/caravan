import { Injectable } from '@nestjs/common';

import { RedisService } from '@/infrastructure/redis/redis.service';
import { CONSTS } from '../consts';

export interface SessionData {
  sid: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastActivityAt: string;
}

@Injectable()
export class SessionRepository {
  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    return this.redisService.get<T>(key);
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    return this.redisService.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    return this.redisService.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.redisService.exists(key);
  }

  async getSession(sid: string): Promise<SessionData | null> {
    return this.redisService.get<SessionData>(`${CONSTS.SESSION_PREFIX}${sid}`);
  }

  async saveSession(
    sid: string,
    data: SessionData,
    ttl: number,
  ): Promise<void> {
    await this.redisService.set(`${CONSTS.SESSION_PREFIX}${sid}`, data, ttl);
  }

  async deleteSession(sid: string): Promise<void> {
    await this.redisService.delete(`${CONSTS.SESSION_PREFIX}${sid}`);
  }

  async getUserSessionIds(userId: string): Promise<string[]> {
    return (
      (await this.redisService.get<string[]>(
        `${CONSTS.USER_SESSION_PREFIX}${userId}`,
      )) ?? []
    );
  }

  async saveUserSessionIds(
    userId: string,
    sessionIds: string[],
    ttl: number,
  ): Promise<void> {
    await this.redisService.set(
      `${CONSTS.USER_SESSION_PREFIX}${userId}`,
      sessionIds,
      ttl,
    );
  }

  async deleteUserSessionIds(userId: string): Promise<void> {
    await this.redisService.delete(`${CONSTS.USER_SESSION_PREFIX}${userId}`);
  }

  async addToBlacklist(jti: string, ttl: number): Promise<void> {
    await this.redisService.set(`${CONSTS.BLACK_LIST}${jti}`, true, ttl);
  }
}
