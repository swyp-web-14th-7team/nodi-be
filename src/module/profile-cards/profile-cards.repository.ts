import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Prisma, User, UserProfileCard } from '@/prisma/client';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import { UpdateProfileCardDto } from '@/module/profile-cards/dto/update-profile-card.dto';
import {
  defaultProfileCardIncludeOptions,
  type DefaultUserProfileCard,
  DisplayProfileCard,
  displayProfileCardIncludeOptions,
} from '@/module/profile-cards/profile-cards.type';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

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

  async findUniqueProfileCard(
    whereOptions: Prisma.UserProfileCardWhereUniqueInput,
  ): Promise<UserProfileCard | null> {
    return this.prismaService.userProfileCard.findUnique({
      where: whereOptions,
    });
  }

  async findManyDisplayProfileCards(
    whereOptions: Prisma.UserProfileCardWhereInput,
    { skip, limit, sort, order }: PaginationDto,
  ): Promise<PaginationResult<DisplayProfileCard>> {
    const [total, items] = await Promise.all([
      this.prismaService.userProfileCard.count({ where: whereOptions }),
      this.prismaService.userProfileCard.findMany({
        where: whereOptions,
        include: displayProfileCardIncludeOptions,
        skip: skip,
        take: limit,
        orderBy: { [sort]: order },
      }),
    ]);
    return { total, items };
  }

  async findOneDisplayProfileCard({
    userId,
    cardId,
  }: {
    userId: string;
    cardId: string;
  }): Promise<DisplayProfileCard | null> {
    return this.prismaService.userProfileCard.findUnique({
      where: {
        userId,
        id: cardId,
      },
      include: displayProfileCardIncludeOptions,
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
        personalityId: defaultCard.personalityId, // 개성은 단일 FK 복사
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
      },
    });
  }

  /**
   * 프로필 카드 수정
   * - dto 에 포함된 필드만 변경 (undefined 는 그대로)
   * - skills / interests 는 dto 목록으로 덮어씀:
   *   목록에 없는 것만 삭제(notIn) + 없는 것만 추가(skipDuplicates), 기존에 유지되는 건 안 건드림
   * - personality 는 단일 FK 세팅
   * - nested write 라 한 update 안에서 원자적으로 처리됨
   */
  async updateProfileCard(
    id: string,
    {
      skillIds,
      interestIds,
      personalityId,
      description,
      affiliationStatusId,
      affiliation,
    }: UpdateProfileCardDto,
  ): Promise<UserProfileCard> {
    return this.prismaService.userProfileCard.update({
      where: { id },
      data: {
        description,
        affiliation,
        affiliationStatusId,
        ...(personalityId !== undefined && {
          personalityId: personalityId,
        }),
        ...(skillIds !== undefined && {
          profileCardSkills: {
            deleteMany: { skillId: { notIn: skillIds } },
            createMany: {
              data: skillIds.map((skillId) => ({ skillId })),
              skipDuplicates: true,
            },
          },
        }),
        ...(interestIds !== undefined && {
          profileCardInterests: {
            deleteMany: { interestId: { notIn: interestIds } },
            createMany: {
              data: interestIds.map((interestId) => ({ interestId })),
              skipDuplicates: true,
            },
          },
        }),
      },
    });
  }
}
