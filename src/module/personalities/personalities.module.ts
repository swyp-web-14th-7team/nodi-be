import { UsersModule } from '@/module/users/users.module';
import { Module } from '@nestjs/common';
import { PersonalitiesController } from '@/module/personalities/personalities.controller';
import { PersonalitiesService } from '@/module/personalities/personalities.service';
import { PersonalitiesRepository } from '@/module/personalities/personalities.repository';

@Module({
  imports: [UsersModule],
  controllers: [PersonalitiesController],
  providers: [PersonalitiesService, PersonalitiesRepository],
})
export class PersonalitiesModule {}
