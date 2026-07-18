import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';
import { ProfileCardsService } from '@/module/profile-cards/profile-cards.service';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';
import { DisplayProfileCard } from '@/module/profile-cards/profile-cards.type';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { FindPublicProfileCardDto } from '@/module/profile-cards/dto/find-public-profile-card.dto';
import { PaginationType } from '@/common/type/pagination.type';

@Controller('public/profile-cards')
export class PublicProfileCardsController {
  constructor(private readonly profileCardsService: ProfileCardsService) {}

  /**
   * QR 공유 토큰으로 프로필 카드 조회 (public)
   *
   * @remarks
   * 인증 없이 QR 공유 토큰으로 프로필 카드를 조회합니다. (QR 스캔용)
   *
   * 토큰을 가진 것 자체가 접근 권한이므로, 목록에 노출되지 않는
   * 비공개(isActive=false) 카드도 이 경로로는 조회됩니다.
   *
   * ★ experiences 는 전체를 sortOrder 오름차순으로 포함합니다.
   * @param token
   */
  @Get('share/:token')
  @ApiResponseSuccess(ProfileCardResponse)
  @ApiNotFoundResponse({ description: '프로필 카드를 찾을 수 없습니다.' })
  async getSharedProfileCard(
    @Param('token') token: string,
  ): Promise<ProfileCardResponse> {
    const item: DisplayProfileCard =
      await this.profileCardsService.findOneSharedProfileCard(token);
    return ProfileCardResponse.fromProfileCard(item);
  }

  /**
   * 프로필 카드 단건 조회 (public)
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
   * 공개 프로필 카드 목록 조회 (public)
   *
   * @remarks
   * 인증 없이 활성(isActive) 프로필 카드 목록을 조회합니다.
   * purpose / jobTypeId / affiliationStatusId 필터와 keywords(닉네임) 검색을 지원합니다.
   *
   * ★ experiences 는 **대표 경험 1개만**(sortOrder 가장 앞) 포함됩니다.
   *   전체 경험이 필요하면 단건 조회를 사용하세요. (사설 목록 조회와 동일한 규칙)
   * @param dto
   */
  @Get()
  @ApiResponsePagination(ProfileCardResponse)
  async getPublicProfileCards(
    @Query() dto: FindPublicProfileCardDto,
  ): Promise<PaginationType<ProfileCardResponse>> {
    const { total, items } =
      await this.profileCardsService.findAllPublicProfileCards(dto);
    return {
      items: items.map((item) => ProfileCardResponse.fromProfileCard(item)),
      metadata: {
        ...dto,
        total,
      },
    };
  }
}
