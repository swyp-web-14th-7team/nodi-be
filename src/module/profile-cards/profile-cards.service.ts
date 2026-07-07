import { Injectable } from '@nestjs/common';
import { ProfileCardsRepository } from '@/module/profile-cards/profile-cards.repository';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import type { User, UserProfileCard } from '@/prisma/client';

@Injectable()
export class ProfileCardsService {
  constructor(
    private readonly profileCardsRepository: ProfileCardsRepository,
  ) {}

  async createProfileCard(
    user: User,
    dto: CreateProfileCardDto,
  ): Promise<UserProfileCard> {
    const defaultCard =
      await this.profileCardsRepository.findDefaultProfileCard(user.id);

    // default 카드가 있으면 그 정보를 seed 로 복사, 없으면(첫 카드) default 로 생성
    return defaultCard
      ? this.profileCardsRepository.createProfileCard(user, dto, defaultCard)
      : this.profileCardsRepository.createDefaultProfileCard(user, dto);
  }
}
