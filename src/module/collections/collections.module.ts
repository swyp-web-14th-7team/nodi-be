import { Module } from '@nestjs/common';
import { CollectionsController } from '@/module/collections/collections.controller';

@Module({
  controllers: [CollectionsController],
})
export class CollectionsModule {}
