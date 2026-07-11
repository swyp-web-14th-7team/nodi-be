import { Module } from '@nestjs/common';
import { UsersModule } from '@/module/users/users.module';
import { ProfileCardTemplatesController } from '@/module/profile-card-templates/proifle-cards-templates.controller';
import { ProfileCardTemplatesService } from '@/module/profile-card-templates/profile-card-templates.service';
import { ProfileCardTemplatesRepository } from '@/module/profile-card-templates/profile-card-templates.repository';

@Module({
  imports: [UsersModule],
  controllers: [ProfileCardTemplatesController],
  providers: [ProfileCardTemplatesService, ProfileCardTemplatesRepository],
})
export class ProfileCardTemplatesModule {}
