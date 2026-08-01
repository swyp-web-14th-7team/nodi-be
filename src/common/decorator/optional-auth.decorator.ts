import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { OptionalAuthGuard } from '@/common/guard/optional-auth.guard';

/**
 * 선택적 인증 데코레이터
 * @remarks 토큰이 있으면 검증해 req.user 를 채우고, 없거나 유효하지 않으면 비로그인으로 통과시킵니다.
 * 핸들러에서는 `@CurrentUser() user?: User` 로 받아 로그인 여부를 분기하세요.
 *
 * 인증을 강제하려면 {@link Auth} 를 사용하세요.
 */
export function OptionalAuth() {
  return applyDecorators(UseGuards(OptionalAuthGuard), ApiBearerAuth());
}
