import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Prisma, User } from '@/prisma/client';
import { UserRole } from '@/common/enum/user-role.enum';
import { LoginParams } from '@/module/users/type/login-params.type';
import { UpdateProfileDto } from '@/module/users/dto/update-profile.dto';
import {
  UserWithDefaultCard,
  userWithDefaultCardIncludeOptions,
} from '@/module/users/users.type';

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /** 단건 조회 — 탈퇴(deletedAt) 유저는 제외 */
  async findUniqueUser(
    whereOptions: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { ...whereOptions, deletedAt: null },
    });
  }

  /** 단건 조회 - 탈퇴 유저는 제외, default User 포함 */
  async findUniqueUserWithDefaultCard(
    whereOptions: Prisma.UserWhereUniqueInput,
  ): Promise<UserWithDefaultCard | null> {
    return this.prismaService.user.findUnique({
      where: { ...whereOptions, deletedAt: null },
      include: userWithDefaultCardIncludeOptions,
    });
  }

  /** 인증(provider) 정보로 단건 조회 — 탈퇴 유저는 제외 */
  async findUniqueUserByAuth(
    whereOptions: Prisma.UserAuthWhereUniqueInput,
  ): Promise<User | null> {
    const data: { user: User } | null =
      await this.prismaService.userAuth.findUnique({
        where: { ...whereOptions, user: { deletedAt: null } },
        select: { user: true },
      });
    return data?.user ?? null;
  }

  /** 프로필 수정 */
  async updateUser(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<UserWithDefaultCard> {
    return this.prismaService.user.update({
      where: { id },
      data: { ...dto },
      include: userWithDefaultCardIncludeOptions,
    });
  }

  /** 신규 유저 + 인증 동시 생성. role 은 서비스에서 결정해 전달한다. */
  async createUser({
    name,
    email,
    providerId,
    provider,
    role,
  }: LoginParams & { role?: UserRole }): Promise<User> {
    return this.prismaService.user.create({
      data: {
        name,
        email,
        nickname: name,
        ...(role && { role }),
        auths: { create: { providerId, provider } },
      },
    });
  }

  /** 기존 유저에 새 provider 인증만 연결 */
  async createUserAuth({
    userId,
    provider,
    providerId,
  }: {
    userId: string;
    provider: LoginParams['provider'];
    providerId: string;
  }): Promise<void> {
    await this.prismaService.userAuth.create({
      data: { userId, provider, providerId },
    });
  }
}
