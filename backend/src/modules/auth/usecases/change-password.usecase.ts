import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { USER_AUTH_SERVICE } from '@/common/contracts/user-contract.interface';
import type { IUserAuthContract } from '@/common/contracts/user-contract.interface';
import { ERRORS } from '../consts';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_AUTH_SERVICE)
    private readonly userAuthService: IUserAuthContract,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(
    id: string,
    username: string,
    oldpass: string,
    newpass: string,
  ): Promise<boolean> {
    const user = await this.userAuthService.updateUserPassword({
      id,
      username,
      oldpass,
      newpass,
    });

    if (!user) {
      throw new UnauthorizedException(ERRORS.USER_NOT_FOUND);
    }

    await this.refreshTokenRepository.revokeAllForUser(user.id, 'system');

    return true;
  }
}
