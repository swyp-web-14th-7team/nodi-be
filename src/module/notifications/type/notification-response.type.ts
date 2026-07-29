import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@/module/notifications/type/notification-type.enum';
import type { NotificationPayload } from '@/module/notifications/type/notification-type.enum';
import { Notification } from '@/prisma/client';
import { FormattedDate } from '@/common/type/formatted-date.type';

export class NotificationResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({
    type: 'integer',
    enum: Object.values(NotificationType),
    description: '1: 수락됨, 2: 거절됨',
  })
  type: NotificationType;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: '알림 타입별 상세 데이터',
  })
  payload: NotificationPayload;

  @ApiProperty({ type: FormattedDate, nullable: true })
  readAt: FormattedDate | null;

  @ApiProperty({ type: FormattedDate })
  createdAt: FormattedDate;

  static fromNotification(notification: Notification): NotificationResponse {
    return {
      id: notification.id,
      type: notification.type as NotificationType,
      payload: notification.payload as NotificationPayload,
      readAt: notification.readAt
        ? FormattedDate.fromDate(notification.readAt)
        : null,
      createdAt: FormattedDate.fromDate(notification.createdAt),
    };
  }
}
