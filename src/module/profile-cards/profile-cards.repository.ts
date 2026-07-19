import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Prisma, User, UserProfileCard } from '@/prisma/client';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import { UpdateProfileCardDto } from '@/module/profile-cards/dto/update-profile-card.dto';
import { FindPublicProfileCardDto } from '@/module/profile-cards/dto/find-public-profile-card.dto';
import {
  defaultProfileCardIncludeOptions,
  type DefaultUserProfileCard,
  DisplayProfileCard,
  displayProfileCardIncludeOptions,
  listProfileCardIncludeOptions,
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
        // 목록: 대표 경험 1개만 포함
        include: listProfileCardIncludeOptions,
        skip: skip,
        take: limit,
        orderBy: { [sort]: order },
      }),
    ]);
    return { total, items };
  }

  /** 공개(활성) 프로필 카드 목록 조회 (필터: purpose/jobType/affiliationStatus, 검색: 닉네임/관심사) */
  async findManyPublicProfileCards({
    skip,
    limit,
    sort,
    order,
    purposeId,
    affiliationStatusId,
    jobTypeId,
    keywords,
  }: FindPublicProfileCardDto): Promise<PaginationResult<DisplayProfileCard>> {
    const where: Prisma.UserProfileCardWhereInput = {
      isActive: true,
      // undefined 면 필터 없음, 값이 있으면 해당 값으로 필터
      purposeId,
      affiliationStatusId,
      jobTypeId,
      // 닉네임 또는 관심사 이름 부분 일치 검색
      ...(keywords && {
        OR: [
          { nickname: { contains: keywords } },
          {
            profileCardInterests: {
              some: { interest: { name: { contains: keywords } } },
            },
          },
        ],
      }),
    };
    const [total, items] = await Promise.all([
      this.prismaService.userProfileCard.count({ where }),
      this.prismaService.userProfileCard.findMany({
        where,
        // 목록: 대표 경험 1개만 포함
        include: listProfileCardIncludeOptions,
        skip,
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

  /** 카드 ID 로 단건 조회 (소유자 무관, public 조회용) */
  async findPublicDisplayProfileCard(
    cardId: string,
  ): Promise<DisplayProfileCard | null> {
    return this.prismaService.userProfileCard.findUnique({
      where: { id: cardId, isActive: true },
      include: displayProfileCardIncludeOptions,
    });
  }

  /**
   * 첫 카드 = 기본(default) 카드 생성
   * 기본 카드는 특정 목적에 종속되지 않는 원본이므로 purposeId 는 항상 null 로 고정한다.
   * (dto.purposeId 가 넘어와도 무시)
   */
  async createDefaultProfileCard(
    user: User,
    dto: CreateProfileCardDto,
  ): Promise<DisplayProfileCard> {
    return this.prismaService.userProfileCard.create({
      data: {
        userId: user.id,
        nickname: user.nickname,
        jobTypeId: dto.jobTypeId,
        purposeId: null,
        isDefault: true,
        isActive: false,
      },
      include: displayProfileCardIncludeOptions,
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
  ): Promise<DisplayProfileCard> {
    return this.prismaService.userProfileCard.create({
      data: {
        userId: user.id,
        nickname: defaultCard.nickname,
        description: defaultCard.description,
        jobTypeId: defaultCard.jobTypeId, // 직군은 유저 단위로 고정 → default 에서 복사 (dto.jobTypeId 무시)
        purposeId: dto.purposeId,
        personalityId: defaultCard.personalityId, // 개성은 단일 FK 복사
        affiliationStatusId: defaultCard.affiliationStatusId, // 소속 상태 FK 복사
        affiliation: defaultCard.affiliation, // 소속(자유 입력) 복사
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
      include: displayProfileCardIncludeOptions,
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
      cardImageUrl,
      profileImageUrl,
      isActive,
      links,
      experiences,
    }: UpdateProfileCardDto,
  ): Promise<DisplayProfileCard> {
    return this.prismaService.userProfileCard.update({
      where: { id },
      include: displayProfileCardIncludeOptions,
      data: {
        description,
        affiliation,
        affiliationStatusId,
        cardImageUrl,
        profileImageUrl,
        isActive,
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
        // 링크는 value 가 항목마다 달라 전체 교체(기존 삭제 후 재생성)
        ...(links !== undefined && {
          profileCardLinks: {
            deleteMany: {},
            create: links.map(({ type, value }) => ({ type, value })),
          },
        }),
        // 경험은 식별자(id)가 없고 순서·내용이 자유롭게 바뀌므로 전체 교체 (links 와 동일)
        // nested write 는 delete 를 create 보다 먼저 실행하므로 (cardId, sortOrder) 유니크 충돌 없음
        ...(experiences !== undefined && {
          experiences: {
            deleteMany: {},
            create: experiences.map(
              ({ title, description, relatedUrl, sortOrder }) => ({
                title,
                description,
                relatedUrl,
                sortOrder,
              }),
            ),
          },
        }),
      },
    });
  }

  /** 프로필 카드 삭제. 연결된 경험/스킬/관심사/링크/스크랩은 스키마의 onDelete 규칙으로 함께 정리된다. */
  async deleteProfileCard(id: string): Promise<void> {
    await this.prismaService.userProfileCard.delete({ where: { id } });
  }
}
