import { Module } from '@nestjs/common';
import { UsersModule } from '@/module/users/users.module';
import { JobTypesController } from '@/module/job-types/job-types.controller';
import { JobTypesService } from '@/module/job-types/job-types.service';
import { JobTypesRepository } from '@/module/job-types/job-types.repository';

@Module({
  imports: [UsersModule],
  controllers: [JobTypesController],
  providers: [JobTypesService, JobTypesRepository],
})
export class JobTypesModule {}
