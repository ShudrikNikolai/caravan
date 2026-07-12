import { ConfigService } from '@/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import CONSTS from '../consts';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RefreshTokenPayload } from '../interfaces/refresh-token.interface';
// TODO
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  CONSTS.REFRESH_TOKEN,
) {
  constructor(
    private configService: ConfigService,
    private refreshTokenRepository: RefreshTokenRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromBodyField('refreshToken'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.refresh_token,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtRefreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshTokenPayload) {
    const refreshToken = await this.refreshTokenRepository.findByToken(
      payload.jti,
    );

    if (!refreshToken || !refreshToken.isValid()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      userId: payload.sub,
      refreshTokenId: payload.jti,
      refreshToken: refreshToken,
    };
  }
}
