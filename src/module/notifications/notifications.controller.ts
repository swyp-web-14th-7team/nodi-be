import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { NotificationsService } from '@/module/notifications/notifications.service';
import { UserRole } from '@/common/enum/user-role.enum';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { interval, map, merge, Observable, takeUntil, timer } from 'rxjs';
import { type User } from '@/prisma/client';
import { Auth } from '@/common/decorator/auth.decorator';

/** 프록시 유휴 타임아웃 방지 + 죽은 커넥션 탐지 트리거. 끄면 안 된다. */
const HEARTBEAT_INTERVAL_MS = 20_000;

/**
 * 스트림 수명 상한.
 * AuthGuard 는 연결 시점에 1회만 토큰을 검증하는데 SSE 는 응답이 끝나지 않는다.
 * 상한이 없으면 액세스 토큰이 만료되거나 계정이 정지돼도 그 커넥션은 계속 알림을 받는다.
 * 주기적으로 끊어 클라이언트가 새 토큰으로 재인증하도록 강제한다.
 */
const STREAM_MAX_AGE_MS = 30 * 60 * 1000;

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  @Auth(UserRole.ADMIN, UserRole.USER)
  stream(@CurrentUser() user: User): Observable<MessageEvent> {
    return merge(
      this.notificationsService.stream(user.id),
      interval(HEARTBEAT_INTERVAL_MS).pipe(
        map(() => ({ type: 'ping', data: '' })),
      ),
    ).pipe(takeUntil(timer(STREAM_MAX_AGE_MS)));
  }
}
