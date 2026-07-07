import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { User, UserProfileCard } from '@/prisma/client';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import {
  defaultProfileCardIncludeOptions,
  type DefaultUserProfileCard,
} from '@/module/profile-cards/profile-cards.type';

@Injectable()
export class ProfileCardsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /** 유저의 기본(default) 카드 조회 (skills/interests/personalities 포함) */
  async findDefaultProfileCard(
    userId: string,
  ): Promise<DefaultUserProfileCard | null> {
    return this.prismaService.userProfileCard.findUnique({
      where: { userId_isDefault: { userId, isDefault: true } },
      include: defaultProfileCardIncludeOptions,
    });
  }

  /** 첫 카드 = 기본(default) 카드 생성 */
  async createDefaultProfileCard(
    user: User,
    dto: CreateProfileCardDto,
  ): Promise<UserProfileCard> {
    return this.prismaService.userProfileCard.create({
      data: {
        userId: user.id,
        nickname: user.nickname,
        templateId: dto.templateId,
        cardImageUrl: dto.cardImageUrl,
        isDefault: true,
        isActive: false,
      },
    });
  }

  /**
   * 기본 카드를 seed 로 새 카드 생성
   * skills / interests / personalities 를 nested createMany 로 함께 복사 (원자적)
   */
  async createProfileCard(
    user: User,
    dto: CreateProfileCardDto,
    defaultCard: DefaultUserProfileCard,
  ): Promise<UserProfileCard> {
    return this.prismaService.userProfileCard.create({
      data: {
        userId: user.id,
        nickname: defaultCard.nickname,
        templateId: dto.templateId,
        cardImageUrl: dto.cardImageUrl,
        isDefault: false,
        isActive: false,
        profileCardSkills: {
          createMany: {
            data: defaultCard.profileCardSkills.map(({ skillId }) => ({
              skillId,
            })),
          },
        },
        profileCardInterests: {
          createMany: {
            data: defaultCard.profileCardInterests.map(({ interestId }) => ({
              interestId,
            })),
          },
        },
        profileCardPersonalities: {
          createMany: {
            data: defaultCard.profileCardPersonalities.map(
              ({ personalityId }) => ({ personalityId }),
            ),
          },
        },
      },
    });
  }
}
