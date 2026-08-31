import { ConfigService } from '@/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CONSTS, ERRORS } from '../consts';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ExternalUserService } from '../services/external-user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, CONSTS.JWT) {
  constructor(
    private configService: ConfigService,
    private readonly externalUserService: ExternalUserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          return req.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.externalUserService.findUserById(`${payload.sub}`);

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
