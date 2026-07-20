import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
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
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { UpdateProfileDto } from '@/module/users/dto/update-profile.dto';
import { UserWithDefaultCard } from '@/module/users/users.type';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationType } from '@/common/type/pagination.type';
import { AdminUserResponse } from '@/module/users/type/admin-user-response.type';

// 탈퇴 시 로그인 세션(리프레시 토큰) 쿠키를 함께 제거한다. (auth.controller 와 동일 키/옵션)
const REFRESH_TOKEN_KEY: string = 'refresh_token';
const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
};

@ApiInternalServerErrorResponse()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 전체 유저 조회 (관리자)
   * @remarks
   * 모든 유저를 페이지네이션으로 조회합니다. 탈퇴한 유저도 포함됩니다. ADMIN 권한이 필요합니다.
   *
   * **요청 query**
   * - page, limit, sort, order: 페이지네이션 옵션
   *
   * **응답 body**
   * - items: 유저 목록 (각 항목에 마지막 로그인 시각 lastLoginAt, 탈퇴 시각 deletedAt 포함)
   * - metadata: 페이지네이션 정보
   */
  @Get()
  @Auth(UserRole.ADMIN)
  @ApiResponsePagination(AdminUserResponse)
  async getAllUsers(
    @Query() pagination: PaginationDto,
  ): Promise<PaginationType<AdminUserResponse>> {
    const { total, items } = await this.usersService.findAllUsers(pagination);
    return {
      items: items.map((item) => AdminUserResponse.fromUser(item)),
      metadata: { ...pagination, total },
    };
  }

  /**
   * 내 정보 조회
   * @remarks
   * 현재 로그인한 사용자의 프로필 정보를 반환합니다. User 이상의 역할이 필합니다.
   * @param user
   */
  @Get('me')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiResponseSuccess(UserResponse)
  async getMe(@CurrentUser() user: User): Promise<UserResponse> {
    const data: UserWithDefaultCard | User | null =
      await this.usersService.findUnique(
        {
          id: user.id,
        },
        true,
      );
    if (!data) throw new NotFoundException('유저를 찾을 수 없습니다.');
    return UserResponse.fromUser(data);
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

  /**
   * 회원 탈퇴
   * @remarks
   * 현재 로그인한 사용자를 탈퇴 처리합니다. 계정 정보는 일정 기간 보관됩니다.
   *
   * - 소셜 인증 연결이 해제되어 더 이상 로그인할 수 없습니다.
   * - 모든 기기의 로그인 세션이 종료되고 리프레시 토큰 쿠키가 제거됩니다.
   * - 동일한 이메일/소셜 계정으로 다시 가입할 수 있습니다.
   */
  @Delete('me')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiResponseSuccess()
  async withdraw(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.usersService.withdraw(user);
    res.clearCookie(REFRESH_TOKEN_KEY, REFRESH_TOKEN_COOKIE_OPTIONS);
  }
}
