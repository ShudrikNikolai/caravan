import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { CONSTS, ERRORS } from '../consts';
import { ExternalUserService } from '../services/external-user.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, CONSTS.LOCAL) {
  constructor(private externalUserService: ExternalUserService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(login: string, password: string) {
    const user = await this.externalUserService.validateUser(login, password);

    if (!user) {
      throw new UnauthorizedException(ERRORS.INVALID_CREDENTIALS);
    }

    return user;
  }
}
