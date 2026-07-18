import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProfileCardsService } from '@/module/profile-cards/profile-cards.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { type User } from '@/prisma/client';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';
import { ProfileCardShareResponse } from '@/module/profile-cards/type/profile-card-share-response.type';
import { UpdateProfileCardDto } from '@/module/profile-cards/dto/update-profile-card.dto';
import { ApiNotFoundResponse } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationType } from '@/common/type/pagination.type';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { DisplayProfileCard } from '@/module/profile-cards/profile-cards.type';

@Controller('profile-cards')
export class ProfileCardsController {
  constructor(private readonly profileCardsService: ProfileCardsService) {}

  /**
   * 유저 프로필 카드 목록 조회
   * @remarks
   * 로그인한 유저 본인이 소유한 프로필 카드 목록을 페이지네이션으로 조회합니다.
   *
   * ★ experiences 는 **대표 경험 1개만**(sortOrder 가장 앞) 포함됩니다.
   *   전체 경험이 필요하면 단건 조회(`GET /profile-cards/{id}`)를 사용하세요.
   *   그 외 응답 필드(skills·links·personality 등)는 단건 조회와 동일합니다.
   * @param user
   * @param paginationDto
   */
  @Get()
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponsePagination(ProfileCardResponse)
  async getProfileCards(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationType<ProfileCardResponse>> {
    const { total, items } =
      await this.profileCardsService.findAllDisplayProfileCards(
        user,
        paginationDto,
      );
    return {
      items: items.map((item) => ProfileCardResponse.fromProfileCard(item)),
      metadata: {
        ...paginationDto,
        total,
      },
    };
  }

  /**
   * 유저 프로필 카드 단건 조회
   * @remarks
   * 로그인한 유저 본인이 소유한 프로필 카드를 id 로 조회합니다.
   * 본인 소유가 아니거나 존재하지 않으면 404 를 반환합니다.
   *
   * ★ experiences 는 **전체**를 sortOrder 오름차순으로 포함합니다.
   *   (목록 조회는 대표 1개만 — 차이 주의)
   * @param user
   * @param id
   */
  @Get(':id')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(ProfileCardResponse)
  @ApiNotFoundResponse({ description: '프로필 카드를 찾을 수 없습니다.' })
  async getProfileCard(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ProfileCardResponse> {
    const item: DisplayProfileCard =
      await this.profileCardsService.findOneDisplayProfileCard(user, id);
    return ProfileCardResponse.fromProfileCard(item);
  }

  /**
   * QR 공유 토큰 조회
   *
   * @remarks
   * 카드의 QR 공유 토큰을 조회합니다. 소유자만 조회할 수 있습니다.
   *
   * 프론트에서 이 토큰으로 `{웹 share 경로}?shareToken={shareToken}` 형태의 URL 을 만들어
   * QR 로 인코딩합니다. QR 을 스캔해 그 페이지가 열리면, 페이지는 쿼리로 받은 shareToken 으로
   * `GET /public/profile-cards/share/{shareToken}` 을 호출해 카드를 렌더링합니다.
   * @param user
   * @param id
   */
  @Get(':id/share')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(ProfileCardShareResponse)
  @ApiNotFoundResponse({ description: '프로필 카드를 찾을 수 없습니다.' })
  async getProfileCardShareToken(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ProfileCardShareResponse> {
    const shareToken: string = await this.profileCardsService.findShareToken(
      user,
      id,
    );
    return ProfileCardShareResponse.fromShareToken(shareToken);
  }

  /**
   * QR 공유 토큰 재발급
   *
   * @remarks
   * 카드의 QR 공유 토큰을 새로 발급합니다. 소유자만 호출할 수 있습니다.
   *
   * 이미 공유한 QR 을 무효화할 때 사용합니다. 재발급 시점부터 기존 토큰으로는
   * 조회되지 않습니다.
   * @param user
   * @param id
   */
  @Patch(':id/share')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(ProfileCardShareResponse)
  @ApiNotFoundResponse({ description: '프로필 카드를 찾을 수 없습니다.' })
  async updateProfileCardShareToken(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ProfileCardShareResponse> {
    const shareToken: string = await this.profileCardsService.updateShareToken(
      user,
      id,
    );
    return ProfileCardShareResponse.fromShareToken(shareToken);
  }

  /**
   * 유저 프로필 카드 생성
   * @remarks
   * 유저 프로필 카드를 생성합니다. 동작 방식은 두 가지로 나뉩니다.
   *
   * 1. 유저의 Default 프로필 카드가 없는 경우 (온보딩)
   * 2. 유저의 Default 프로필 카드가 있는 경우 (추후 카드 생성 시점)
   *
   * ★ 응답은 관계까지 포함한 완전한 카드(단건 조회와 동일 형태)입니다.
   *   experiences 는 전체 포함이며, 첫 카드(온보딩)는 아직 비어 있어 `[]` 로 나옵니다.
   * @param user
   * @param dto
   */
  @Post()
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(ProfileCardResponse)
  async createProfileCard(
    @CurrentUser() user: User,
    @Body() dto: CreateProfileCardDto,
  ) {
    const data: DisplayProfileCard =
      await this.profileCardsService.createProfileCard(user, dto);
    return ProfileCardResponse.fromProfileCard(data);
  }

  /**
   * 유저 프로필 카드 업데이트
   *
   * @remarks
   * 유저 프로필 카드를 업데이트 합니다. RequestBody 의 모든 값은 Optional 하며, 주입한 값만 업데이트 합니다.
   *
   * links 는 전체 교체(넘긴 목록으로 덮어씀)이며, 각 항목 type 매핑은 다음과 같습니다.
   * 0: EMAIL, 1: INSTAGRAM, 2: GITHUB, 3: LINKEDIN, 4: BEHANCE, 5: NOTION, 6: WEBSITE
   *
   * experiences 도 전체 교체입니다(넘긴 목록으로 기존 경험을 통째로 덮어씀).
   *
   * ★ 응답은 갱신된 관계까지 포함한 완전한 카드(단건 조회와 동일 형태)이며,
   *   experiences 는 전체를 포함합니다.
   * @param user
   * @param id
   * @param dto
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiResponseSuccess(ProfileCardResponse)
  @ApiNotFoundResponse({ description: '프로필 카드를 찾을 수 없습니다.' })
  async updateProfileCard(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateProfileCardDto,
  ) {
    const data: DisplayProfileCard =
      await this.profileCardsService.updateProfileCard(user, id, dto);
    return ProfileCardResponse.fromProfileCard(data);
  }
}
