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
import { UpdateDefaultProfileCardDto } from '@/module/profile-cards/dto/update-default-profile-card.dto';
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

  async findDefaultDisplayProfileCard(user: User): Promise<DisplayProfileCard> {
    const defaultCard: DisplayProfileCard | null =
      await this.profileCardsRepository.findDefaultDisplayProfileCard(user.id);
    if (!defaultCard)
      throw new NotFoundException('기본 카드가 존재하지 않습니다.');
    return defaultCard;
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

  async createProfileCard(
    user: User,
    dto: CreateProfileCardDto,
  ): Promise<DisplayProfileCard> {
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
  ): Promise<DisplayProfileCard> {
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

  /**
   * 기본(default) 카드 수정 (nickname / links 만 대상)
   * 소유권은 update where 의 userId 로 보장되므로 별도 조회 없이 바로 수정한다.
   * 기본 카드가 없으면 대상 미존재(P2025) → 404 로 변환한다.
   */
  async updateDefaultProfileCard(
    user: User,
    dto: UpdateDefaultProfileCardDto,
  ): Promise<DisplayProfileCard> {
    try {
      return await this.profileCardsRepository.updateDefaultProfileCard(
        user.id,
        dto,
      );
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      )
        throw new NotFoundException('기본 카드가 존재하지 않습니다.');
      throw e;
    }
  }

  async deleteProfileCard(user: User, id: string): Promise<void> {
    const target: UserProfileCard | null =
      await this.profileCardsRepository.findUniqueProfileCard({ id });
    if (!target || target.userId !== user.id)
      throw new NotFoundException('프로필 카드를 찾을 수 없습니다.');

    // 기본 카드는 다른 카드 생성의 원본(seed)이므로 삭제할 수 없다.
    if (target.isDefault)
      throw new BadRequestException('기본 프로필 카드는 삭제할 수 없습니다.');

    await this.profileCardsRepository.deleteProfileCard(id);
  }
}
