import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/prisma/client';

export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromUser(item: User): UserResponse {
    return {
      id: item.id,
      name: item.name,
      nickname: item.nickname,
      email: item.email,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
