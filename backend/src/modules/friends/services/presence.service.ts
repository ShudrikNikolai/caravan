import { Injectable } from '@nestjs/common';

import { RedisService } from '@/infrastructure/redis/redis.service';

@Injectable()
export class PresenceService {
  constructor(private readonly redisService: RedisService) {}

  private key(userId: string): string {
    return `presence:user:${userId}`;
  }

  async connect(userId: string, socketId: string): Promise<void> {
    await this.redisService.sAdd(this.key(userId), socketId);
  }

  /**
   * Returns true while at least one socket for the user remains connected.
   */
  async disconnect(userId: string, socketId: string): Promise<boolean> {
    await this.redisService.sRem(this.key(userId), socketId);

    return (await this.redisService.sCard(this.key(userId))) > 0;
  }

  async isOnline(userId: string): Promise<boolean> {
    return (await this.redisService.sCard(this.key(userId))) > 0;
  }

  async areOnline(userIds: string[]): Promise<Record<string, boolean>> {
    const entries = await Promise.all(
      userIds.map(
        async (userId) => [userId, await this.isOnline(userId)] as const,
      ),
    );

    return Object.fromEntries(entries);
  }
}
