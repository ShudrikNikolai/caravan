import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { USER_AUTH_SERVICE } from '@/common/contracts/user-contract.interface';
import type { IUserAuthContract } from '@/common/contracts/user-contract.interface';
import { ERRORS } from '../consts';
import type { Tokens } from '../interfaces/tokens.interface';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { TokenService } from '../services/token.service';

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(USER_AUTH_SERVICE)
    private readonly userAuthService: IUserAuthContract,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshTokenId: string, userId: string): Promise<Tokens> {
    const storedToken =
      await this.refreshTokenRepository.findByToken(refreshTokenId);

    if (!storedToken || !storedToken.isValid()) {
      throw new UnauthorizedException(ERRORS.INVALID_REFRESH_TOKEN);
    }

    const user = await this.userAuthService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException(ERRORS.USER_NOT_FOUND);
    }

    await this.refreshTokenRepository.revokeToken(
      storedToken.jti,
      'system',
      'refreshed',
    );

    return this.tokenService.generateTokens(user);
  }
}
