import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { USER_AUTH_SERVICE } from '@/common/contracts/user-contract.interface';
import type { IUserAuthContract } from '@/common/contracts/user-contract.interface';
import { ConfigService } from '@/config';
import { CONSTS, ERRORS } from '../consts';
import type { ILoginResponseSchema } from '../schemas/reponse.schema';
import type { TLoginSchema } from '../schemas/login.schema';
import { SessionService } from '../services/session.service';
import { TokenService } from '../services/token.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_AUTH_SERVICE)
    private readonly userAuthService: IUserAuthContract,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    loginSchema: TLoginSchema,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ILoginResponseSchema> {
    const identifier =
      loginSchema.identifier ?? loginSchema.email ?? loginSchema.username;

    if (!identifier) {
      throw new UnauthorizedException(ERRORS.INVALID_CREDENTIALS);
    }

    const user = await this.userAuthService.validateUser(
      identifier,
      loginSchema.password,
    );

    if (!user) {
      throw new UnauthorizedException(ERRORS.INVALID_CREDENTIALS);
    }

    const isBlacklisted = await this.sessionService.exists(
      `${CONSTS.BLACK_LIST}${user.id}`,
    );

    if (isBlacklisted) {
      throw new UnauthorizedException();
    }

    const tokens = await this.tokenService.generateTokens(user);

    const sessionId = this.configService.auth.sessionEnb
      ? await this.sessionService.createSession(user.id, ipAddress, userAgent)
      : undefined;

    return {
      user,
      tokens,
      sessionId,
    };
  }
}
