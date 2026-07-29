import {
  Controller,
  Sse,
  MessageEvent,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { NotificationsService } from '@/module/notifications/notifications.service';
import { UserRole } from '@/common/enum/user-role.enum';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { interval, map, merge, Observable, takeUntil, timer } from 'rxjs';
import { type User } from '@/prisma/client';
import { Auth } from '@/common/decorator/auth.decorator';
import { FindAllNotificationsDto } from '@/module/notifications/dto/find-all-notifications.dto';
import { PaginationType } from '@/common/type/pagination.type';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { NotificationResponse } from '@/module/notifications/type/notification-response.type';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiNotFoundResponse, ApiProduces } from '@nestjs/swagger';

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

  /**
   * 실시간 알림 스트림 구독
   *
   * @remarks
   * 로그인한 사용자의 실시간 알림을 SSE(Server-Sent Events)로 구독합니다.
   *
   * 연결 요청이 수락되거나 거절되면 `notification` 이벤트로 알림이 전달됩니다.
   *
   * **이벤트 종류**
   *
   * - notification: 새 알림. data에는 알림 JSON 문자열이 포함됩니다.
   *
   * - ping: 연결 유지를 위해 20초마다 전달되는 heartbeat입니다.
   *
   * 스트림은 인증 상태를 다시 확인할 수 있도록 최대 30분 동안 유지되며,
   *
   * 종료된 이후에는 새로운 액세스 토큰으로 다시 연결해야 합니다.
   *
   * 실시간 연결 중이 아니었던 기간의 알림은 알림 목록 조회 API로 확인할 수 있습니다.
   */
  @Sse('stream')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiProduces('text/event-stream')
  stream(@CurrentUser() user: User): Observable<MessageEvent> {
    return merge(
      this.notificationsService.stream(user.id),
      interval(HEARTBEAT_INTERVAL_MS).pipe(
        map(() => ({ type: 'ping', data: '' })),
      ),
    ).pipe(takeUntil(timer(STREAM_MAX_AGE_MS)));
  }

  /**
   * 내 알림 목록 조회
   *
   * @remarks
   * 로그인한 사용자에게 생성된 알림을 최신순으로 페이지네이션 조회합니다.
   *
   * 앱이 꺼져 있거나 SSE에 연결되지 않았던 동안 생성된 알림도 포함됩니다.
   *
   * **요청 query**
   *
   * - page: 페이지 번호 (기본값 1)
   *
   * - limit: 페이지당 항목 수 (기본값 10, 최대 100)
   *
   * - sort: 정렬 기준. `createdAt`만 허용됩니다.
   *
   * - order: 정렬 방향 (`asc` 또는 `desc`, 기본값 `desc`)
   *
   * - isRead: 읽음 여부 필터 (`true` 또는 `false`, optional)
   *
   * **응답 body**
   *
   * - items: 알림 목록
   *
   * - items[].type: 알림 타입 (1 수락 / 2 거절)
   *
   * - items[].payload: 연결 요청 및 상대 카드 정보
   *
   * - items[].readAt: 읽은 시각. 미읽음이면 null
   *
   * - items[].createdAt: 알림 생성 시각
   *
   * - metadata: 페이지네이션 정보
   */
  @Get()
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponsePagination(NotificationResponse)
  async findAll(
    @CurrentUser() user: User,
    @Query() dto: FindAllNotificationsDto,
  ): Promise<PaginationType<NotificationResponse>> {
    const { items, total } = await this.notificationsService.findAll(
      user.id,
      dto,
    );
    return {
      items: items.map((item) => NotificationResponse.fromNotification(item)),
      metadata: {
        page: dto.page,
        limit: dto.limit,
        sort: dto.sort,
        order: dto.order,
        total,
      },
    };
  }

  /**
   * 알림 읽음 처리
   *
   * @remarks
   * 로그인한 사용자가 소유한 알림을 읽음 상태로 변경합니다.
   *
   * 이미 읽은 알림에 다시 요청해도 읽음 상태가 유지됩니다.
   *
   * 다른 사용자의 알림이거나 존재하지 않는 알림이면 찾을 수 없는 알림으로 처리합니다.
   *
   * **path param**
   *
   * - id: 읽음 처리할 알림 ID
   *
   * **응답 body**
   *
   * - 없음
   */
  @Patch(':id/read')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess()
  @ApiNotFoundResponse({ description: '알림을 찾을 수 없습니다.' })
  async checkRead(@CurrentUser() user: User, @Param('id') id: string) {
    await this.notificationsService.checkRead(id, user.id);
    return {};
  }
}
