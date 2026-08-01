import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';
import { ProfileCardsService } from '@/module/profile-cards/profile-cards.service';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';
import { DisplayProfileCard } from '@/module/profile-cards/profile-cards.type';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { FindAllPublicProfileCardsDto } from '@/module/profile-cards/dto/find-all-public-profile-cards.dto';
import { PaginationType } from '@/common/type/pagination.type';
import { OptionalAuth } from '@/common/decorator/optional-auth.decorator';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { type User } from '@/prisma/client';

@Controller('public/profile-cards')
export class PublicProfileCardsController {
  constructor(private readonly profileCardsService: ProfileCardsService) {}

  /**
   * 공개 프로필 카드 단건 조회 (public)
   *
   * @remarks
   * 인증 없이 카드 ID 로 프로필 카드를 조회합니다. (카드 공유용)
   *
   * ★ experiences 는 전체를 sortOrder 오름차순으로 포함합니다. (목록 조회는 대표 1개만)
   * @param id
   */
  @Get(':id')
  @ApiResponseSuccess(ProfileCardResponse)
  @ApiNotFoundResponse({ description: '프로필 카드를 찾을 수 없습니다.' })
  async getPublicProfileCard(
    @Param('id') id: string,
  ): Promise<ProfileCardResponse> {
    const item: DisplayProfileCard =
      await this.profileCardsService.findOnePublicProfileCard(id);
    return ProfileCardResponse.fromProfileCard(item);
  }

  /**
   * 공개 프로필 카드 목록 조회 (선택적 인증)
   *
   * @remarks
   * 활성(isActive) 프로필 카드 목록을 조회합니다.
   * purpose / jobTypeId / affiliationStatusId 필터와 keywords(닉네임) 검색을 지원합니다.
   *
   * ★ 토큰은 **선택**입니다. 없으면 활성 카드 전체를, 유효한 토큰을 보내면
   *   내가 소유한 카드와 이미 연결된 카드를 제외한 목록을 반환합니다.
   *   (만료/위조 토큰은 401 이 아니라 비로그인으로 처리됩니다)
   *
   * ★ experiences 는 **대표 경험 1개만**(sortOrder 가장 앞) 포함됩니다.
   *   전체 경험이 필요하면 단건 조회를 사용하세요. (사설 목록 조회와 동일한 규칙)
   * @param dto
   * @param user
   */
  @Get()
  @OptionalAuth()
  @ApiResponsePagination(ProfileCardResponse)
  async getPublicProfileCards(
    @Query() dto: FindAllPublicProfileCardsDto,
    @CurrentUser() user?: User,
  ): Promise<PaginationType<ProfileCardResponse>> {
    const { total, items } =
      await this.profileCardsService.findAllPublicProfileCards(dto, user);
    return {
      items: items.map((item) => ProfileCardResponse.fromProfileCard(item)),
      metadata: {
        ...dto,
        total,
      },
    };
  }
}
