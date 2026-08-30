import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = 'user' in request ? request.user : null;

    if (!user || typeof data !== 'string') {
      return null;
    }

    return data ? user[data] : user;
  },
);
