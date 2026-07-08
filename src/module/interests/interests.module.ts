import { UsersModule } from '@/module/users/users.module';
import { Module } from '@nestjs/common';
import { InterestsController } from '@/module/interests/interests.controller';
import { InterestsService } from '@/module/interests/Interests.service';
import { InterestsRepository } from '@/module/interests/interests.repository';

@Module({
  imports: [UsersModule],
  controllers: [InterestsController],
  providers: [InterestsService, InterestsRepository],
})
export class InterestsModule {}
