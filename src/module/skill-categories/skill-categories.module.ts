import { Module } from '@nestjs/common';
import { SkillCategoriesController } from '@/module/skill-categories/skill-categories.controller';
import { SkillCategoriesService } from '@/module/skill-categories/skill-categories.service';
import { SkillCategoriesRepository } from '@/module/skill-categories/skill-categories.repository';
import { UsersModule } from '@/module/users/users.module'; // AuthGuard(UsersService) 의존

@Module({
  imports: [UsersModule],
  controllers: [SkillCategoriesController],
  providers: [SkillCategoriesService, SkillCategoriesRepository],
})
export class SkillCategoriesModule {}
