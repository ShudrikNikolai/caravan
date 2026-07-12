import { ConfigService } from '@/config';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import CONSTS from '../consts';
import { RedisService } from '@/infrastructure/redis/redis.service';

export interface SessionData {
  // TODO
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

  async createSession(
    userId: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const sid = sessionId || uuidv4();
    const sessionData = {
      sid,
      userId,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
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
    userSessions.push(sid);

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

  async updateSession(sid: string, data: Partial<SessionData>): Promise<void> {
    const session = await this.getSession(sid);

    if (session) {
      const updatedSession = { ...session, ...data };
      await this.redisService.set(
        `${this.sessionPrefix}${sid}`,
        updatedSession,
        this.sessionTtl,
      );
    }
  }

  async destroySession(sid: string): Promise<void> {
    const session = await this.getSession(sid);

    if (session) {
      // Удаляем сессию
      await this.redisService.delete(`${this.sessionPrefix}${sid}`);

      // Удаляем из набора сессий пользователя
      const userSessionsKey = `${this.userSessionsPrefix}${session.userId}`;
      const userSessions =
        (await this.redisService.get<string[]>(userSessionsKey)) || [];

      const updatedSessions = userSessions.filter((s) => s !== sid);

      if (updatedSessions.length > 0) {
        await this.redisService.set(
          userSessionsKey,
          updatedSessions,
          this.sessionTtl,
        );
      } else {
        await this.redisService.delete(userSessionsKey);
      }
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
      (await this.redisService.get<string[]>(userSessionsKey)) || [];

    const sessions: SessionData[] = [];

    // Получаем все сессии параллельно
    if (sessionIds.length > 0) {
      const sessionPromises = sessionIds.map((sid) => this.getSession(sid));

      const results = await Promise.all(sessionPromises);

      for (const session of results) {
        if (session) {
          sessions.push(session);
        }
      }
    }

    return sessions;
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
  async addTokenByBlackList(userId: string): Promise<void> {
    const sessionData = {
      userId,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    const userBlackListKey = `${CONSTS.BLACK_LIST}${userId}`;

    // Сохраняем обновленный список
    await this.redisService.set(userBlackListKey, sessionData, this.sessionTtl);
  }
}
