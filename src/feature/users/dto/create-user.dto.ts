import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@/prisma/client';

export class CreateUserDto implements Pick<
  Prisma.UserCreateInput,
  'name' | 'nickname' | 'email'
> {
  @ApiProperty()
  name: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  email: string;
}
