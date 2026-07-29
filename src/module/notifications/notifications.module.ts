import { UsersModule } from '@/module/users/users.module';
import { RedisModule } from '@/lib/redis/redis.module';
import { Module } from '@nestjs/common';
import { NotificationsController } from '@/module/notifications/notifications.controller';
import { NotificationsService } from '@/module/notifications/notifications.service';
import { NotificationsRepository } from '@/module/notifications/notifications.repository';
import { LoggerModule } from '@/lib/logger/logger.module';

@Module({
  // UsersModule 은 AuthGuard 가 UsersService 를 주입받기 때문에 필요하다.
  // LoggerModule 은 PinoLogger 를 직접 주입하기 위해 필요하다 (전역이 아님).
  // PrismaModule 은 @Global() 이라 import 하지 않아도 된다.
  imports: [RedisModule, UsersModule, LoggerModule],
  providers: [NotificationsService, NotificationsRepository],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
