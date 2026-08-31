import { ConfigService } from '@/config';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CONSTS } from '../consts';
import { RedisService } from '@/infrastructure/redis/redis.service';
// TODO RedisService - бульшую часть можно в реп выкинуть
export interface SessionData {
  sid: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastActivityAt: string;
}

@Injectable()
export class SessionService {
  private readonly sessionPrefix = CONSTS.SESSION_PREFIX;
  private readonly userSessionsPrefix = CONSTS.USER_SESSION_PREFIX;
  private readonly sessionTtl: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.sessionTtl = this.configService.auth.sessionTtl;
  }

  async exists(sid: string): Promise<boolean> {
    return this.redisService.exists(sid);
  }

  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const sid = uuidv4();
    const now = new Date().toISOString();

    const sessionData: SessionData = {
      sid,
      userId,
      ipAddress,
      userAgent,
      createdAt: now,
      lastActivityAt: now,
    };

    // Сохраняем сессию в Redis через RedisService
    await this.redisService.set(
      `${this.sessionPrefix}${sid}`,
      sessionData,
      this.sessionTtl,
    );

    // Сохраняем связь пользователь -> сессии (используем сет)
    // Получаем текущие сессии пользователя
    const userSessionsKey = `${this.userSessionsPrefix}${userId}`;
    const userSessions =
      (await this.redisService.get<string[]>(userSessionsKey)) || [];

    // Добавляем новую сессию
    if (!userSessions.includes(sid)) {
      userSessions.push(sid);
    }

    // Сохраняем обновленный список
    await this.redisService.set(userSessionsKey, userSessions, this.sessionTtl);

    return sid;
  }

  async getSession(sid: string): Promise<SessionData | null> {
    const sessionData = await this.redisService.get<SessionData>(
      `${this.sessionPrefix}${sid}`,
    );

    if (!sessionData) {
      return null;
    }

    // Обновляем время последней активности
    sessionData.lastActivityAt = new Date().toISOString();

    // Обновляем сессию с новым TTL
    await this.redisService.set(
      `${this.sessionPrefix}${sid}`,
      sessionData,
      this.sessionTtl,
    );

    return sessionData;
  }

  async updateSession(
    sid: string,
    data: Partial<Omit<SessionData, 'sid' | 'userId' | 'createdAt'>>,
  ): Promise<void> {
    const session = await this.getSession(sid);

    if (!session) {
      return;
    }

    const updatedSession: SessionData = {
      ...session,
      ...data,
      lastActivityAt: new Date().toISOString(),
    };

    await this.redisService.set(
      `${this.sessionPrefix}${sid}`,
      updatedSession,
      this.sessionTtl,
    );
  }

  async destroySession(sid: string): Promise<void> {
    const session = await this.getSession(sid);

    if (!session) {
      return;
    }

    await this.redisService.delete(`${this.sessionPrefix}${sid}`);

    const userSessionsKey = `${this.userSessionsPrefix}${session.userId}`;

    const userSessions =
      (await this.redisService.get<string[]>(userSessionsKey)) ?? [];

    const updatedSessions = userSessions.filter(
      (sessionId) => sessionId !== sid,
    );

    if (updatedSessions.length === 0) {
      await this.redisService.delete(userSessionsKey);
    } else {
      await this.redisService.set(
        userSessionsKey,
        updatedSessions,
        this.sessionTtl,
      );
    }
  }

  async destroyUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `${this.userSessionsPrefix}${userId}`;
    const sessionIds =
      (await this.redisService.get<string[]>(userSessionsKey)) || [];

    // Удаляем каждую сессию
    if (sessionIds.length > 0) {
      const deletePromises = sessionIds.map((sid) =>
        this.redisService.delete(`${this.sessionPrefix}${sid}`),
      );

      await Promise.all(deletePromises);
    }

    // Удаляем ключ сессий пользователя
    await this.redisService.delete(userSessionsKey);
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    const userSessionsKey = `${this.userSessionsPrefix}${userId}`;

    const sessionIds =
      (await this.redisService.get<string[]>(userSessionsKey)) ?? [];

    if (sessionIds.length === 0) {
      return [];
    }

    const sessions = await Promise.all(
      sessionIds.map((sid) => this.getSession(sid)),
    );

    const activeSessions = sessions.filter(
      (session): session is SessionData => session !== null,
    );

    const activeIds = activeSessions.map((session) => session.sid);

    if (activeIds.length !== sessionIds.length) {
      if (activeIds.length > 0) {
        await this.redisService.set(
          userSessionsKey,
          activeIds,
          this.sessionTtl,
        );
      } else {
        await this.redisService.delete(userSessionsKey);
      }
    }

    return activeSessions;
  }

  async getActiveSessionCount(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    return sessions.length;
  }

  async isSessionValid(sid: string): Promise<boolean> {
    const session = await this.getSession(sid);
    return !!session;
  }

  // в случае, если access token угнали и он не истек, забиваем его в black list
  async addTokenToBlacklist(jti: string, ttl: number): Promise<void> {
    await this.redisService.set(`${CONSTS.BLACK_LIST}${jti}`, true, ttl);
  }
}
