import { ConfigService } from '@/config';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { USER_AUTH_SERVICE } from '@/common/contracts/user-contract.interface';
import type { IUserAuthContract } from '@/common/contracts/user-contract.interface';
import { CONSTS, ERRORS } from '../consts';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, CONSTS.JWT) {
  constructor(
    private configService: ConfigService,
    @Inject(USER_AUTH_SERVICE)
    private readonly userAuthService: IUserAuthContract,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) =>
          (req.cookies as { access_token?: string } | undefined)
            ?.access_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userAuthService.findUserById(`${payload.sub}`);

    if (!user) {
      throw new UnauthorizedException(ERRORS.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      username: user.username,
      user, // Полный объект пользователя
    };
  }
}
