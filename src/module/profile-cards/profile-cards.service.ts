import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProfileCardsRepository } from '@/module/profile-cards/profile-cards.repository';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import { Prisma } from '@/prisma/client';
import type { User, UserProfileCard } from '@/prisma/client';
import { UpdateProfileCardDto } from '@/module/profile-cards/dto/update-profile-card.dto';
import { FindPublicProfileCardDto } from '@/module/profile-cards/dto/find-public-profile-card.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';
import { DisplayProfileCard } from '@/module/profile-cards/profile-cards.type';

@Injectable()
export class ProfileCardsService {
  constructor(
    private readonly profileCardsRepository: ProfileCardsRepository,
  ) {}

  async findAllDisplayProfileCards(
    user: User,
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<DisplayProfileCard>> {
    return this.profileCardsRepository.findManyDisplayProfileCards(
      { userId: user.id },
      paginationDto,
    );
  }

  async findOneDisplayProfileCard(
    user: User,
    cardId: string,
  ): Promise<DisplayProfileCard> {
    const profileCard: DisplayProfileCard | null =
      await this.profileCardsRepository.findOneDisplayProfileCard({
        userId: user.id,
        cardId,
      });
    if (!profileCard)
      throw new NotFoundException('프로필 카드를 찾을 수 없습니다.');
    return profileCard;
  }

  /** 인증 없이 공개(활성) 프로필 카드 목록 조회 (public) */
  async findAllPublicProfileCards(
    dto: FindPublicProfileCardDto,
  ): Promise<PaginationResult<DisplayProfileCard>> {
    return this.profileCardsRepository.findManyPublicProfileCards(dto);
  }

  /** 인증 없이 카드 ID 로 단건 조회 (public) */
  async findOnePublicProfileCard(cardId: string): Promise<DisplayProfileCard> {
    const profileCard: DisplayProfileCard | null =
      await this.profileCardsRepository.findPublicDisplayProfileCard(cardId);
    if (!profileCard)
      throw new NotFoundException('프로필 카드를 찾을 수 없습니다.');
    return profileCard;
  }

  /**
   * QR 공유 토큰으로 단건 조회 (public)
   * 토큰을 가진 것 자체가 접근 권한이라 비공개(isActive=false) 카드도 조회된다.
   */
  async findOneSharedProfileCard(
    shareToken: string,
  ): Promise<DisplayProfileCard> {
    const profileCard: DisplayProfileCard | null =
      await this.profileCardsRepository.findSharedDisplayProfileCard(
        shareToken,
      );
    if (!profileCard)
      throw new NotFoundException('프로필 카드를 찾을 수 없습니다.');
    return profileCard;
  }

  /** 공유 토큰 조회 (소유자 전용) */
  async findShareToken(user: User, cardId: string): Promise<string> {
    const target: UserProfileCard | null =
      await this.profileCardsRepository.findUniqueProfileCard({ id: cardId });
    if (!target || target.userId !== user.id)
      throw new NotFoundException('프로필 카드를 찾을 수 없습니다.');
    return target.shareToken;
  }

  /** 공유 토큰 재발급 (소유자 전용) — 기존 QR 무효화 */
  async updateShareToken(user: User, cardId: string): Promise<string> {
    const target: UserProfileCard | null =
      await this.profileCardsRepository.findUniqueProfileCard({ id: cardId });
    if (!target || target.userId !== user.id)
      throw new NotFoundException('프로필 카드를 찾을 수 없습니다.');
    const updated: UserProfileCard =
      await this.profileCardsRepository.updateShareToken(cardId);
    return updated.shareToken;
  }

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

  async updateProfileCard(
    user: User,
    id: string,
    dto: UpdateProfileCardDto,
  ): Promise<UserProfileCard> {
    const target: UserProfileCard | null =
      await this.profileCardsRepository.findUniqueProfileCard({ id });
    if (!target || target.userId !== user.id)
      throw new NotFoundException('프로필 카드를 찾을 수 없습니다.');

    try {
      return await this.profileCardsRepository.updateProfileCard(id, dto);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // 존재하지 않는 skill/interest/personality ID → FK 위반(P2003)
        if (e.code === 'P2003')
          throw new BadRequestException(
            '존재하지 않는 스킬/관심사/개성/소속상태 ID 가 포함되어 있습니다.',
          );
        // 유니크 제약 위반(P2002). 경험 sortOrder 중복은 DTO @ArrayUnique 로 먼저 걸리지만,
        // 그 외 유니크 충돌을 500 대신 400 으로 방어.
        if (e.code === 'P2002')
          throw new BadRequestException('중복된 값이 포함되어 있습니다.');
      }
      throw e;
    }
  }
}
