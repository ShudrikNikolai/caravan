import { UnauthorizedException, Type } from '@nestjs/common';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';

export function createAuthGuard(strategy: string | string[]): Type<IAuthGuard> {
  class MixinAuthGuard extends AuthGuard(strategy) {
    handleRequest<TUser>(err: any, user: TUser, info: any) {
      if (err || !user) {
        if (info && 'name' in info && info.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Token expired');
        }
        throw err instanceof Error
          ? err
          : new UnauthorizedException('Invalid or expired token');
      }
      return user;
    }
  }
  return MixinAuthGuard;
}
