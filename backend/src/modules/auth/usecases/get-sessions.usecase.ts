import { Injectable } from '@nestjs/common';

import { ConfigService } from '@/config';
import type { ISessionResponse } from '../schemas/reponse.schema';
import { SessionService } from '../services/session.service';

@Injectable()
export class GetSessionsUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {}

  async execute(userId: string): Promise<ISessionResponse[]> {
    if (!this.configService.auth.sessionEnb) {
      return [];
    }

    const sessions = await this.sessionService.getUserSessions(userId);

    return sessions.map((session) => ({
      id: session.sid,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
    }));
  }
}
