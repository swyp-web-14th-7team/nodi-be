import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { type User } from '@/prisma/client';
import { type Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | undefined => {
    const request: Request & { user: User | undefined } = ctx
      .switchToHttp()
      .getRequest();
    return request.user;
  },
);
