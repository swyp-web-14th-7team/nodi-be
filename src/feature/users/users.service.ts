import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { type CreateUserDto } from '@/feature/users/dto/create-user.dto';
import { type User } from '@/prisma/client';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@/common/enum/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createItem(dto: CreateUserDto): Promise<User> {
    return this.prismaService.user.create({
      data: {
        ...dto,
        ...(this.configService.get<string>('ADMIN_EMAIL') === dto.email && {
          role: UserRole.Admin,
        }),
      },
    });
  }
}
