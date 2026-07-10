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
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';
import { DisplayProfileCard } from '@/module/profile-cards/profile-cards.type';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';

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
      // 존재하지 않는 skill/interest/personality ID → FK 위반(P2003)
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      )
        throw new BadRequestException(
          '존재하지 않는 스킬/관심사/개성/소속상태 ID 가 포함되어 있습니다.',
        );
      throw e;
    }
  }
}
