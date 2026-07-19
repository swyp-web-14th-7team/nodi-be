import { Module } from '@nestjs/common';
import { CollectionsController } from '@/module/collections/collections.controller';
import { CollectionGroupsController } from '@/module/collections/collection-groups.controller';
import { CollectionsService } from '@/module/collections/collections.service';
import { CollectionsRepository } from '@/module/collections/collections.repository';
import { UsersModule } from '@/module/users/users.module'; // AuthGuard(UsersService) 의존

@Module({
  imports: [UsersModule],
  controllers: [CollectionGroupsController, CollectionsController],
  providers: [CollectionsService, CollectionsRepository],
})
export class CollectionsModule {}
