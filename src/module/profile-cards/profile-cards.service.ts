import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProfileCardsRepository } from '@/module/profile-cards/profile-cards.repository';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import { Prisma } from '@/prisma/client';
import type { User, UserProfileCard } from '@/prisma/client';
import { UpdateProfileCardDto } from '@/module/profile-cards/dto/update-profile-card.dto';
import { FindAllPublicProfileCardsDto } from '@/module/profile-cards/dto/find-all-public-profile-cards.dto';
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

  /**
   * 공개(활성) 프로필 카드 목록 조회 (선택적 인증)
   *
   * @remarks
   * 비로그인이면 활성 카드 전체를 그대로 반환한다.
   * 로그인 상태면 내가 소유한 카드와 이미 연결된 카드를 제외한다. (total 집계에도 동일 적용)
   */
  async findAllPublicProfileCards(
    dto: FindAllPublicProfileCardsDto,
    user?: User,
  ): Promise<PaginationResult<DisplayProfileCard>> {
    return this.profileCardsRepository.findManyPublicProfileCards(dto, user);
  }

  /** 인증 없이 카드 ID 로 단건 조회 (public) */
  async findOnePublicProfileCard(cardId: string): Promise<DisplayProfileCard> {
    const profileCard: DisplayProfileCard | null =
      await this.profileCardsRepository.findPublicDisplayProfileCard(cardId);
    if (!profileCard)
      throw new NotFoundException('프로필 카드를 찾을 수 없습니다.');
    return profileCard;
  }

  /** 프로필 카드 생성. 첫 카드(온보딩)든 이후 카드든 동작이 같다. */
  async createProfileCard(
    user: User,
    dto: CreateProfileCardDto,
  ): Promise<DisplayProfileCard> {
    return this.profileCardsRepository.createProfileCard(user, dto);
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
   * 프로필 카드 삭제
   *
   * @remarks
   * 마지막 남은 한 장은 삭제할 수 없다. 카드가 0장이 되면 유저가 연결·공개 기능을
   * 전혀 쓸 수 없는 상태로 떨어지기 때문. 요청 자체는 유효하고 카드가 2장 이상이면
   * 성공하므로, 400 이 아니라 상태 충돌(409)로 응답한다.
   */
  async deleteProfileCard(user: User, id: string): Promise<void> {
    const target: UserProfileCard | null =
      await this.profileCardsRepository.findUniqueProfileCard({ id });
    if (!target || target.userId !== user.id)
      throw new NotFoundException('프로필 카드를 찾을 수 없습니다.');

    const cardCount = await this.profileCardsRepository.countProfileCards(
      user.id,
    );
    if (cardCount <= 1)
      throw new ConflictException('마지막 프로필 카드는 삭제가 불가합니다.');

    await this.profileCardsRepository.deleteProfileCard(id);
  }
}
