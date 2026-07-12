import { UnauthorizedException, Type } from '@nestjs/common';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';
// TODO
export function createAuthGuard(strategy: string | string[]): Type<IAuthGuard> {
  class MixinAuthGuard extends AuthGuard(strategy) {
    handleRequest(err: any, user: any, info: any) {
      if (err || !user) {
        throw err || new UnauthorizedException('Invalid or expired token');
      }
      return user;
    }
  }
  return MixinAuthGuard;
}
