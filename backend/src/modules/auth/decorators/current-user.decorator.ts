import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    // TODO облепить еще типами
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = 'user' in request ? request.user : null;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
