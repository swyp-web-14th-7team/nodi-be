import { ApiProperty } from '@nestjs/swagger';
import { FormattedDate } from '@/common/type/formatted-date.type';
import { UserWithLastLogin } from '@/module/users/users.type';

export class AdminUserResponse {
  @ApiProperty({ description: '유저 ID' })
  id: string;

  @ApiProperty({ description: '유저 이름' })
  name: string;

  @ApiProperty({ description: '유저 닉네임' })
  nickname: string;

  @ApiProperty({ example: 'test@swyp.ts' })
  email: string;

  @ApiProperty({ description: '권한 (0: 일반 유저, 1: ADMIN)' })
  role: number;

  @ApiProperty()
  createdAt: FormattedDate;

  @ApiProperty({
    nullable: true,
    description: '마지막 로그인 시각 (가장 최근 리프레시 토큰 생성 시각)',
  })
  lastLoginAt: FormattedDate | null;

  @ApiProperty({ nullable: true, description: '탈퇴 시각 (미탈퇴 시 null)' })
  deletedAt: FormattedDate | null;

  static fromUser(item: UserWithLastLogin): AdminUserResponse {
    const lastLogin = item.refreshTokens[0]?.createdAt ?? null;
    return {
      id: item.id,
      name: item.name,
      nickname: item.nickname,
      email: item.email,
      role: item.role,
      createdAt: FormattedDate.fromDate(item.createdAt),
      lastLoginAt: lastLogin ? FormattedDate.fromDate(lastLogin) : null,
      deletedAt: item.deletedAt ? FormattedDate.fromDate(item.deletedAt) : null,
    };
  }
}
