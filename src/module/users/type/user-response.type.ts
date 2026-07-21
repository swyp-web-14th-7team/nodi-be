import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/prisma/client';
import { FormattedDate } from '@/common/type/formatted-date.type';
import { UserWithDefaultCard } from '@/module/users/users.type';
import { ProfileCardResponse } from '@/module/profile-cards/type/profile-card-response.type';

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

  @ApiProperty({ nullable: true })
  defaultCard: ProfileCardResponse | null;

  static fromUser(item: User | UserWithDefaultCard): UserResponse {
    return {
      id: item.id,
      name: item.name,
      nickname: item.nickname,
      email: item.email,
      createdAt: FormattedDate.fromDate(item.createdAt),
      updatedAt: FormattedDate.fromDate(item.updatedAt),
      defaultCard:
        'profileCards' in item && item.profileCards[0]
          ? ProfileCardResponse.fromProfileCard(item.profileCards[0])
          : null,
    };
  }
}
