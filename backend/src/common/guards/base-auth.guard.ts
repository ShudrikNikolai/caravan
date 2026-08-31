import { UnauthorizedException, Type } from '@nestjs/common';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';
import { API_AUTH } from '../utils/const.util';

export function createAuthGuard(strategy: string | string[]): Type<IAuthGuard> {
  class MixinAuthGuard extends AuthGuard(strategy) {
    handleRequest<TUser>(err: unknown, user: TUser, info: unknown) {
      console.log('createAuthGuard >>>>>>>', { err, user, info });
      if (err || !user) {
        if (
          info &&
          typeof info === 'object' &&
          API_AUTH.KEY in info &&
          info[API_AUTH.KEY] === API_AUTH.KEY_EXPIRE
        ) {
          throw new UnauthorizedException(API_AUTH.ERR.TOKEN_EXPIRED);
        }
        throw err instanceof Error
          ? err
          : new UnauthorizedException(API_AUTH.ERR.INVALID);
      }
      return user;
    }
  }
  return MixinAuthGuard;
}
