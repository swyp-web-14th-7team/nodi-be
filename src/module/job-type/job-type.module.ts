import { Module } from '@nestjs/common';
import { UsersModule } from '@/module/users/users.module';
import { JobTypeController } from '@/module/job-type/job-type.controller';
import { JobTypeService } from '@/module/job-type/job-type.service';
import { JobTypeRepository } from '@/module/job-type/job-type.repository';

@Module({
  imports: [UsersModule],
  controllers: [JobTypeController],
  providers: [JobTypeService, JobTypeRepository],
})
export class JobTypeModule {}
