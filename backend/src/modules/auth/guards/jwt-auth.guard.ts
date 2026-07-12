import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import CONSTS from '../consts';
import { createAuthGuard } from '@/common/guards/base-auth.guard';

@Injectable()
export class JwtAuthGuard extends createAuthGuard(CONSTS.JWT) {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      CONSTS.D_IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
