import { Injectable } from '@nestjs/common';

import { ConfigService } from '@/config';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { SessionService } from '../services/session.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(userId, 'system');

    if (this.configService.auth.sessionEnb) {
      await this.sessionService.destroyUserSessions(userId);
    }
  }
}
