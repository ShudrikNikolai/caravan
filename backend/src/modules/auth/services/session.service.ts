import { ConfigService } from '@/config';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  SessionData,
  SessionRepository,
} from '../repositories/session.repository';

export type { SessionData } from '../repositories/session.repository';

@Injectable()
export class SessionService {
  private readonly sessionTtl: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly sessionRepository: SessionRepository,
  ) {
    this.sessionTtl = this.configService.auth.sessionTtl;
  }

  async exists(key: string): Promise<boolean> {
    return this.sessionRepository.exists(key);
  }

  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const sid = randomUUID();
    const now = new Date().toISOString();

    const sessionData: SessionData = {
      sid,
      userId,
      ipAddress,
      userAgent,
      createdAt: now,
      lastActivityAt: now,
    };

    await this.sessionRepository.saveSession(sid, sessionData, this.sessionTtl);

    const userSessions = await this.sessionRepository.getUserSessionIds(userId);

    if (!userSessions.includes(sid)) {
      userSessions.push(sid);
    }

    await this.sessionRepository.saveUserSessionIds(
      userId,
      userSessions,
      this.sessionTtl,
    );

    return sid;
  }

  async getSession(sid: string): Promise<SessionData | null> {
    const sessionData = await this.sessionRepository.getSession(sid);

    if (!sessionData) {
      return null;
    }

    sessionData.lastActivityAt = new Date().toISOString();

    await this.sessionRepository.saveSession(sid, sessionData, this.sessionTtl);

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

    await this.sessionRepository.saveSession(
      sid,
      updatedSession,
      this.sessionTtl,
    );
  }

  async destroySession(sid: string): Promise<void> {
    const session = await this.sessionRepository.getSession(sid);

    if (!session) {
      return;
    }

    await this.sessionRepository.deleteSession(sid);

    const userSessions = await this.sessionRepository.getUserSessionIds(
      session.userId,
    );
    const updatedSessions = userSessions.filter(
      (sessionId) => sessionId !== sid,
    );

    if (updatedSessions.length === 0) {
      await this.sessionRepository.deleteUserSessionIds(session.userId);
    } else {
      await this.sessionRepository.saveUserSessionIds(
        session.userId,
        updatedSessions,
        this.sessionTtl,
      );
    }
  }

  async destroyUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.sessionRepository.getUserSessionIds(userId);

    await Promise.all(
      sessionIds.map((sid) => this.sessionRepository.deleteSession(sid)),
    );
    await this.sessionRepository.deleteUserSessionIds(userId);
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessionIds = await this.sessionRepository.getUserSessionIds(userId);

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
        await this.sessionRepository.saveUserSessionIds(
          userId,
          activeIds,
          this.sessionTtl,
        );
      } else {
        await this.sessionRepository.deleteUserSessionIds(userId);
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

  async addTokenToBlacklist(jti: string, ttl: number): Promise<void> {
    await this.sessionRepository.addToBlacklist(jti, ttl);
  }
}
