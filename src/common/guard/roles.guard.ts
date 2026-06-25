import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '@/common/decorator/roles.decorator';
import { User } from '@/prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride(Roles, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user: User }>();
    if (!user) throw new UnauthorizedException('유저 정보가 없습니다');
    if (!requiredRoles.includes(user.role))
      throw new ForbiddenException('접근 권한이 없습니다.');
    return true;
  }
}
