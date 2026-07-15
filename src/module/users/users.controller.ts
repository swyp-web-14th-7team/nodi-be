import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from '@/module/users/users.service';
import { type User } from '@/prisma/client';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserResponse } from '@/module/users/type/user-response.type';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { UpdateProfileDto } from '@/module/users/dto/update-profile.dto';

@ApiInternalServerErrorResponse()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 내 정보 조회
   * @remarks
   * 현재 로그인한 사용자의 프로필 정보를 반환합니다. User 이상의 역할이 필합니다.
   * @param user
   */
  @Get('me')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiResponseSuccess(UserResponse)
  getMe(@CurrentUser() user: User): UserResponse {
    return UserResponse.fromUser(user);
  }

  /**
   * 유저 정보 업데이트
   * @remarks
   * nickname 의 길이는 1 ~ 255 입니다.
   * @param user
   * @param dto
   */
  @Patch('me')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiResponseSuccess(UserResponse)
  @ApiBadRequestResponse({
    description: 'nickname 의 형식이 올바르지 않습니다.',
  })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponse> {
    const newUser: User = await this.usersService.updateMyProfile(user, dto);
    return UserResponse.fromUser(newUser);
  }
}
