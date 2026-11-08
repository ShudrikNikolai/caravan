import { ConfigService } from '@/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ERRORS } from '../consts';
import type { RefreshTokenPayload } from '../interfaces/refresh-token.interface';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

@Injectable()
export class LogoutFromDeviceUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(userId: string, refreshToken: string): Promise<void> {
    let payload: RefreshTokenPayload;

    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.auth.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException(ERRORS.INVALID_REFRESH_TOKEN);
    }

    if (payload.sub !== userId) {
      throw new UnauthorizedException(ERRORS.TOKEN_WTF);
    }

    await this.refreshTokenRepository.revokeToken(
      payload.jti,
      userId,
      'User logged out from device',
    );
  }
}
