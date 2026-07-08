import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ProfileCardsService } from '@/module/profile-cards/profile-cards.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { type User, UserProfileCard } from '@/prisma/client';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';
import { UpdateProfileCardDto } from '@/module/profile-cards/dto/update-profile-card.dto';
import { ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';

@Controller('profile-cards')
export class ProfileCardsController {
  constructor(private readonly profileCardsService: ProfileCardsService) {}

  /**
   * 유저 프로필 카드 생성
   * @remarks
   * 유저 프로필 카드를 생성합니다. 동작 방식은 두 가지로 나뉩니다.
   *
   * 1. 유저의 Default 프로필 카드가 없는 경우 (온보딩)
   * 2. 유저의 Default 프로필 카드가 있는 경우 (추후 카드 생성 시점)
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
    const data: UserProfileCard =
      await this.profileCardsService.createProfileCard(user, dto);
    return ProfileCardResponse.fromProfileCard(data);
  }

  /**
   * 유저 프로필 카드 업데이트
   *
   * @remarks
   * 유저 프로필 카드를 업데이트 합니다. RequestBody 의 모든 값은 Optional 하며, 주입한 값만 업데이트 합니다.
   * @param user
   * @param id
   * @param dto
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: '프로필 카드를 찾을 수 없습니다.' })
  async updateProfileCard(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateProfileCardDto,
  ) {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data = await this.profileCardsService.updateProfileCard(
      user,
      targetId,
      dto,
    );
    return ProfileCardResponse.fromProfileCard(data);
  }
}
