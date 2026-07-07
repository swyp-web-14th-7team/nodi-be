import { Body, Controller, Post } from '@nestjs/common';
import { ProfileCardsService } from '@/module/profile-cards/profile-cards.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { type User, UserProfileCard } from '@/prisma/client';
import { CreateProfileCardDto } from '@/module/profile-cards/dto/create-profile-card.dto';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';

@Controller('profile-cards')
export class ProfileCardsController {
  constructor(private readonly profileCardsService: ProfileCardsService) {}

  /**
   * 유저 프로필 카드 생성 (온보딩)
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
}
