import { ConfigService } from '@/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../user/repositories/user.repository';
import { CONSTS, ERRORS } from '../consts';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, CONSTS.JWT) {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.access_token,
        ExtractJwt.fromUrlQueryParameter(CONSTS.EXTRAXT_JWT_FROM_QUERY),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(`${payload.sub}`);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException(ERRORS.USER_NOT_FOUND);
    }

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      user, // Полный объект пользователя
    };
  }
}
