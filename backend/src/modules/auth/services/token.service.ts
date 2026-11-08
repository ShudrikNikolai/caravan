import { randomUUID } from 'crypto';
import { ConfigService } from '@/config';
import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import type { IUserContract } from '@/common/contracts/user-contract.interface';
import { DEFAULT_TIME } from '../consts';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { Tokens } from '../interfaces/tokens.interface';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async generateTokens(user: IUserContract): Promise<Tokens> {
    const refreshJti = randomUUID();
    const expiresAt = this.getRefreshTokenExpiry();

    const accessTokenPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    };

    const accessTokenOptions: JwtSignOptions = {
      secret: this.configService.auth.jwtSecret,
      expiresIn: this.parseExpiryStringToSeconds(
        this.configService.auth.jwtAccessTtl,
      ),
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret: this.configService.auth.jwtRefreshSecret,
      expiresIn: this.parseExpiryStringToSeconds(
        this.configService.auth.jwtRefreshTtl,
      ),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, accessTokenOptions),
      this.jwtService.signAsync(
        {
          sub: user.id,
          jti: refreshJti,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000),
        },
        refreshTokenOptions,
      ),
      this.refreshTokenRepository.createRefreshToken(
        user.id,
        refreshJti,
        expiresAt,
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshJti,
      expiresIn: this.parseExpiryStringToSeconds(
        this.configService.auth.jwtAccessTtl,
      ),
      tokenType: 'Bearer',
      refreshExpiresIn: this.parseExpiryStringToSeconds(
        this.configService.auth.jwtRefreshTtl,
      ),
    };
  }

  private getRefreshTokenExpiry(): Date {
    const seconds = this.parseExpiryStringToSeconds(
      this.configService.auth.jwtRefreshTtl || DEFAULT_TIME,
    );
    return new Date(Date.now() + seconds * 1000);
  }

  private parseExpiryStringToSeconds(expiry: string | number): number {
    if (typeof expiry === 'number') {
      return expiry;
    }

    if (/^\d+$/.test(expiry)) {
      return parseInt(expiry, 10);
    }

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      const multipliers: Record<string, number> = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60,
      };

      return value * (multipliers[unit] || 1);
    }

    return 900;
  }
}
