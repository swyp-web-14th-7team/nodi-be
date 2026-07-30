import {
  Injectable,
  MessageEvent,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { RedisPubsubService } from '@/lib/redis/redis-pubsub.service';
import { NotificationsRepository } from '@/module/notifications/notifications.repository';
import { map, Observable } from 'rxjs';
import { CreateNotificationInput } from '@/module/notifications/type/notification-type.enum';
import { PinoLogger } from 'nestjs-pino';
import { Notification } from '@/prisma/client';
import { FindAllNotificationsDto } from '@/module/notifications/dto/find-all-notifications.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private static readonly STATS_INTERVAL_MS = 30_000;
  private statsTimer?: NodeJS.Timeout;
  private statsInFlight = false;

  constructor(
    private readonly pubsub: RedisPubsubService,
    private readonly notificationRepository: NotificationsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationsService.name);
  }

  onModuleInit(): void {
    this.statsTimer = setInterval(
      () => void this.logStats(),
      NotificationsService.STATS_INTERVAL_MS,
    );
    this.statsTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.statsTimer) clearInterval(this.statsTimer);
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
          evt: 'noti_publish_failed',
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

  private async logStats(): Promise<void> {
    if (this.statsInFlight) return;
    this.statsInFlight = true;

    try {
      // 개수만으로는 로컬 Map 과 Redis 가 왜 어긋나는지 알 수 없어 채널명까지 남긴다.
      const local = this.pubsub.localChannelNames;
      const redis = await this.pubsub.listChannels('noti:*');
      const localSet = new Set(local);
      const redisSet = new Set(redis);

      this.logger.info(
        {
          evt: 'sse_stats',
          localChannels: local.length,
          redisChannels: redis.length,
          localChannelNames: local,
          redisChannelNames: redis,
          // Map 에만 있는 채널: SUBSCRIBE 실패 또는 finalize 미실행으로 남은 유령 엔트리
          localOnly: local.filter((channel) => !redisSet.has(channel)),
          // Redis 에만 있는 채널: 다른 인스턴스(blue/green)의 구독이거나 unsubscribe 반영 지연
          redisOnly: redis.filter((channel) => !localSet.has(channel)),
        },
        'sse_stats',
      );
    } catch (e) {
      this.logger.warn(
        { evt: 'sse_stats_failed', err: String(e) },
        'sse_stats_failed',
      );
    } finally {
      this.statsInFlight = false;
    }
  }
}
