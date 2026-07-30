import { UsersModule } from '@/module/users/users.module';
import { RedisModule } from '@/lib/redis/redis.module';
import { Module } from '@nestjs/common';
import { NotificationsController } from '@/module/notifications/notifications.controller';
import { NotificationsService } from '@/module/notifications/notifications.service';
import { NotificationsRepository } from '@/module/notifications/notifications.repository';

@Module({
  imports: [RedisModule, UsersModule],
  providers: [NotificationsService, NotificationsRepository],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
