import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guard/auth.guard';
import { RolesGuard } from '@/common/guard/roles.guard';
import { Roles } from '@/common/decorator/roles.decorator';
import { UserRole } from '@/common/enum/user-role.enum';

/**
 * 인증/인가 데코레이터
 * @remarks 전달한 역할(roles)이 있으면 해당 역할만 접근할 수 있도록 제한합니다.
 * roles를 생략하면 인증(로그인)만 요구합니다.
 * @param roles 접근을 허용할 역할 목록
 */
export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    Roles(roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse(),
  );
}