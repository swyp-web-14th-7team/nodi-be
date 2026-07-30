import { Module } from '@nestjs/common';
import { ConnectionsController } from '@/module/connections/connections.controller';
import { ConnectionsService } from '@/module/connections/connections.service';
import { ConnectionRequestsService } from '@/module/connections/connection-requests.service';
import { ConnectionsRepository } from '@/module/connections/connections.repository';
import { ConnectionRequestsController } from '@/module/connections/connection-requests.controller';
import { UsersModule } from '@/module/users/users.module';
import { NotificationsModule } from '@/module/notifications/notifications.module';

@Module({
  imports: [UsersModule, NotificationsModule],
  providers: [
    ConnectionsService,
    ConnectionRequestsService,
    ConnectionsRepository,
  ],
  controllers: [ConnectionsController, ConnectionRequestsController],
})
export class ConnectionsModule {}
