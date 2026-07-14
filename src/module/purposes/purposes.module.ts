import { UsersModule } from '@/module/users/users.module';
import { Module } from '@nestjs/common';
import { PurposesController } from '@/module/purposes/purposes.controller';
import { PurposesService } from '@/module/purposes/purposes.service';
import { PurposesRepository } from '@/module/purposes/purposes.repository';

@Module({
  imports: [UsersModule],
  controllers: [PurposesController],
  providers: [PurposesService, PurposesRepository],
})
export class PurposesModule {}
