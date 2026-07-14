import { Module } from '@nestjs/common';
import { ProfileCardsService } from '@/module/profile-cards/profile-cards.service';
import { ProfileCardsRepository } from '@/module/profile-cards/profile-cards.repository';
import { ProfileCardsController } from '@/module/profile-cards/profile-cards.controller';
import { PublicProfileCardsController } from '@/module/profile-cards/public-profile-cards.controller';
import { UsersModule } from '@/module/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [ProfileCardsService, ProfileCardsRepository],
  controllers: [ProfileCardsController, PublicProfileCardsController],
  exports: [ProfileCardsRepository],
})
export class ProfileCardsModule {}
