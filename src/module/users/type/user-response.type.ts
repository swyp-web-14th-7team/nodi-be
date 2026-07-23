import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/prisma/client';
import { FormattedDate } from '@/common/type/formatted-date.type';
import { UserWithLastLogin } from '@/module/users/users.type';

export class UserResponse {
  @ApiProperty({ description: '유저 ID' })
  id: string;

  @ApiProperty({ description: '유저 이름' })
  name: string;

  @ApiProperty({ description: '유저 닉네임' })
  nickname: string;

  @ApiProperty({ example: 'test@swyp.ts' })
  email: string;

  @ApiProperty()
  createdAt: FormattedDate;

  @ApiProperty()
  updatedAt: FormattedDate;

  @ApiPropertyOptional({ description: '권한 (0: 일반 유저, 1: ADMIN)' })
  role?: number;

  @ApiPropertyOptional({
    nullable: true,
    description: '탈퇴 시각 (미탈퇴 시 null)',
  })
  deletedAt?: FormattedDate | null;

  @ApiPropertyOptional({
    description: '마지막 로그인 시각 (가장 최근 리프레시 토큰 갱신 시각)',
  })
  lastLoginAt?: FormattedDate;

  static fromUser(item: User | UserWithLastLogin): UserResponse {
    return {
      id: item.id,
      name: item.name,
      nickname: item.nickname,
      email: item.email,
      createdAt: FormattedDate.fromDate(item.createdAt),
      updatedAt: FormattedDate.fromDate(item.updatedAt),
      ...('refreshTokens' in item && {
        role: item.role,
        deletedAt: item.deletedAt
          ? FormattedDate.fromDate(item.deletedAt)
          : null,
        ...(item.refreshTokens[0] && {
          lastLoginAt: FormattedDate.fromDate(item.refreshTokens[0].updatedAt),
        }),
      }),
    };
  }
}
