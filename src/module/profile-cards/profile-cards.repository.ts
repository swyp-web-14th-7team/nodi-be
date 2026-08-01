import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Prisma, User, UserProfileCard } from '@/prisma/client';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import { UpdateProfileCardDto } from '@/module/profile-cards/dto/update-profile-card.dto';
import { FindAllPublicProfileCardsDto } from '@/module/profile-cards/dto/find-all-public-profile-cards.dto';
import {
  DisplayProfileCard,
  displayProfileCardIncludeOptions,
  listProfileCardIncludeOptions,
} from '@/module/profile-cards/profile-cards.type';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class ProfileCardsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUniqueProfileCard(
    whereOptions: Prisma.UserProfileCardWhereUniqueInput,
  ): Promise<UserProfileCard | null> {
    return this.prismaService.userProfileCard.findUnique({
      where: whereOptions,
    });
  }

  /** 유저가 소유한 프로필 카드 수 (공개 여부와 무관하게 전부) */
  async countProfileCards(userId: string): Promise<number> {
    return this.prismaService.userProfileCard.count({ where: { userId } });
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

  /**
   * 내 유저가 참여한 모든 연결의 카드 ID 목록.
   *
   * @remarks
   * CardConnection 의 requesterCardId / receiverCardId 는 FK 가 아닌 순수 식별자라
   * Prisma 관계 필터(`none`)를 쓸 수 없다. 그래서 ID 를 먼저 모아 `notIn` 으로 거른다.
   *
   * - 보관함에서 제거된(requesterRemovedAt / receiverRemovedAt) 연결도 포함한다.
   *   행이 남아 있는 한 `@@unique([requesterCardId, receiverCardId])` 때문에 재연결이
   *   불가능하므로, 목록에 다시 노출하면 요청 단계에서 실패하기 때문.
   * - 결과에 내 카드 ID 도 섞여 들어오지만, 호출부에서 userId 로 이미 내 카드를 전부
   *   제외하므로 무해하다.
   */
  private async findConnectedCardIds(userId: string): Promise<string[]> {
    const connections = await this.prismaService.cardConnection.findMany({
      where: {
        OR: [{ requesterUserId: userId }, { receiverUserId: userId }],
      },
      select: { requesterCardId: true, receiverCardId: true },
    });
    return connections.flatMap(({ requesterCardId, receiverCardId }) => [
      requesterCardId,
      receiverCardId,
    ]);
  }

  /**
   * 공개(활성) 프로필 카드 목록 조회 (필터: purpose/jobType/affiliationStatus, 검색: 닉네임/관심사)
   *
   * @param user 로그인한 유저(선택). 넘기면 내가 소유한 카드와 이미 연결된 카드를 목록에서 제외한다.
   */
  async findManyPublicProfileCards(
    {
      skip,
      limit,
      sort,
      order,
      purposeId,
      affiliationStatusId,
      jobTypeId,
      skillIds,
      keywords,
    }: FindAllPublicProfileCardsDto,
    user?: User,
  ): Promise<PaginationResult<DisplayProfileCard>> {
    const connectedCardIds = user
      ? await this.findConnectedCardIds(user.id)
      : [];

    const where: Prisma.UserProfileCardWhereInput = {
      isActive: true,
      // 로그인 상태에서만: 내가 소유한 카드 제외
      ...(user && { userId: { not: user.id } }),
      // 로그인 상태에서만: 이미 연결된 카드 제외
      ...(connectedCardIds.length > 0 && { id: { notIn: connectedCardIds } }),
      // undefined 면 필터 없음, 값이 있으면 해당 값으로 필터
      purposeId,
      affiliationStatusId,
      jobTypeId,
      // 넘긴 스킬 중 하나라도 보유한 카드
      ...(skillIds !== undefined && {
        profileCardSkills: { some: { skillId: { in: skillIds } } },
      }),
      // 닉네임 또는 관심사 이름 부분 일치 검색
      ...(keywords && {
        OR: [
          { nickname: { contains: keywords } },
          {
            profileCardInterests: {
              some: { interest: { name: { contains: keywords } } },
            },
          },
          {
            jobType: {
              name: { contains: keywords },
            },
          },
          {
            profileCardSkills: {
              some: { skill: { name: { contains: keywords } } },
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
   * 프로필 카드 생성
   * - 몇 번째 카드든 동일하게 동작한다 (원본/기본 카드 개념 없음)
   * - nickname 은 유저의 닉네임을 초기값으로 쓰고, 이후 update 로 카드별로 바꾼다
   * - jobTypeId / purposeId 는 dto 값으로 설정 (온보딩 카드는 클라이언트가 purposeId=1 을 보낸다)
   * - 항상 비공개(isActive=false)로 만들고, 나머지 필드는 비워둔 채 이후 update 로 채움
   */
  async createProfileCard(
    user: User,
    { jobTypeId, purposeId }: CreateProfileCardDto,
  ): Promise<DisplayProfileCard> {
    return this.prismaService.userProfileCard.create({
      data: {
        userId: user.id,
        nickname: user.nickname,
        jobTypeId,
        purposeId,
        isActive: false,
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
      nickname,
      skillIds,
      interestIds,
      personalityId,
      purposeId,
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
        nickname,
        description,
        affiliation,
        affiliationStatusId,
        cardImageUrl,
        profileImageUrl,
        isActive,
        ...(personalityId !== undefined && {
          personalityId: personalityId,
        }),
        ...(purposeId !== undefined && {
          purposeId: purposeId,
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
