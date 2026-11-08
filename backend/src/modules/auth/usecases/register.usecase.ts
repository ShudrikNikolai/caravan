import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { USER_AUTH_SERVICE } from '@/common/contracts/user-contract.interface';
import type { IUserAuthContract } from '@/common/contracts/user-contract.interface';
import { ERRORS } from '../consts';
import type { IRegisterResponseSchema } from '../schemas/reponse.schema';
import type { TStrictRegisterSchema } from '../schemas/register.schema';
import { TokenService } from '../services/token.service';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_AUTH_SERVICE)
    private readonly userAuthService: IUserAuthContract,
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    registerSchema: TStrictRegisterSchema,
  ): Promise<IRegisterResponseSchema> {
    const existingUser = await this.userAuthService.findByUsername(
      registerSchema.username,
    );

    if (existingUser) {
      throw new UnauthorizedException(ERRORS.USER_IS_EXISTS);
    }

    const user = await this.userAuthService.createUser({
      password: registerSchema.password,
      username: registerSchema.username || registerSchema.email,
      email: registerSchema.email,
    });

    if (!user) {
      throw new UnauthorizedException(ERRORS.INTERNAL);
    }

    const tokens = await this.tokenService.generateTokens(user);

    return {
      user,
      tokens,
    };
  }
}
