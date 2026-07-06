import { Module } from '@nestjs/common';
import { SkillsController } from '@/module/skills/skills.controller';
import { SkillsService } from '@/module/skills/skills.service';
import { SkillsRepository } from '@/module/skills/skills.repository';
import { UsersModule } from '@/module/users/users.module'; // AuthGuard(UsersService) 의존

@Module({
  imports: [UsersModule],
  controllers: [SkillsController],
  providers: [SkillsService, SkillsRepository],
})
export class SkillsModule {}
