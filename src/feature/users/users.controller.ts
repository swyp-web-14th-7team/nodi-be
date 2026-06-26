import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from '@/feature/users/users.service';
import { type User } from '@/prisma/client';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { AuthGuard } from '@/common/guard/auth.guard';
import { RolesGuard } from '@/common/guard/roles.guard';
import { UserRole } from '@/common/enum/user-role.enum';
import { Roles } from '@/common/decorator/roles.decorator';
import { UserResponse } from '@/feature/users/type/user-response.type';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 내 정보 조회
   * @remarks 현재 로그인한 사용자의 프로필 정보를 반환합니다. User 이상의 역할이 필합니다.
   * @param user
   */
  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.USER])
  @ApiBearerAuth()
  @ApiResponseSuccess(UserResponse)
  @ApiUnauthorizedResponse()
  @ApiInternalServerErrorResponse()
  getMe(@CurrentUser() user: User): UserResponse {
    return UserResponse.fromUser(user);
  }
}
