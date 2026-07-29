import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { RedisPubsubService } from '@/lib/redis/redis-pubsub.service';
import { NotificationsRepository } from '@/module/notifications/notifications.repository';
import { map, Observable } from 'rxjs';
import { CreateNotificationInput } from '@/module/notifications/type/notification-type.enum';
import { PinoLogger } from 'nestjs-pino';
import { Notification } from '@/prisma/client';
import { FindAllNotificationsDto } from '@/module/notifications/dto/find-all-notifications.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly pubsub: RedisPubsubService,
    private readonly notificationRepository: NotificationsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationsService.name);
  }

  private channelOf(userId: string) {
    return `noti:${userId}`;
  }

  stream(userId: string): Observable<MessageEvent> {
    return this.pubsub
      .subscribe(this.channelOf(userId))
      .pipe(map((raw) => ({ type: 'notification', data: raw })));
  }

  /**
   * CreateNotificationInput 은 { type, payload } 짝 전체를 담은 판별 유니온이다.
   * 거절 알림에 connectionId 를 넣는 것 같은 잘못된 조합이 컴파일 단계에서 걸린다.
   */
  async create(
    userId: string,
    dto: CreateNotificationInput,
  ): Promise<Notification> {
    const noti: Notification = await this.notificationRepository.create({
      userId,
      ...dto,
    });

    try {
      await this.pubsub.publish(this.channelOf(userId), JSON.stringify(noti));
    } catch (e) {
      this.logger.warn(
        {
          id: noti.id,
          err: String(e),
        },
        'noti_publish_failed',
      );
    }
    return noti;
  }

  async findAll(
    userId: string,
    dto: FindAllNotificationsDto,
  ): Promise<PaginationResult<Notification>> {
    return this.notificationRepository.findAll(userId, dto);
  }

  async checkRead(id: string, userId: string) {
    const target: Notification | null =
      await this.notificationRepository.findOneById(id);
    if (!target || target.userId !== userId)
      throw new NotFoundException('알림을 찾을 수 없습니다.');

    if (target.readAt === null)
      await this.notificationRepository.update(id, { readAt: new Date() });
  }
}
