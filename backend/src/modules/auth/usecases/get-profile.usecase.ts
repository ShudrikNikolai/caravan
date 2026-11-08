import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { USER_AUTH_SERVICE } from '@/common/contracts/user-contract.interface';
import type { IUserAuthContract } from '@/common/contracts/user-contract.interface';
import { ERRORS } from '../consts';
import type { IUserRes } from '../schemas/reponse.schema';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_AUTH_SERVICE)
    private readonly userAuthService: IUserAuthContract,
  ) {}

  async execute(userId: string): Promise<IUserRes> {
    const user = await this.userAuthService.findUserById(userId);

    if (!user) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    return user;
  }
}
