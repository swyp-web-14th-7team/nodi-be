import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Prisma, User } from '@/prisma/client';
import { UserRole } from '@/common/enum/user-role.enum';
import { LoginParams } from '@/module/users/type/login-params.type';
import { UpdateProfileDto } from '@/module/users/dto/update-profile.dto';
import {
  UserWithDefaultCard,
  userWithDefaultCardIncludeOptions,
  UserWithLastLogin,
  userWithLastLoginIncludeOptions,
} from '@/module/users/users.type';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

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

  /** 전체 유저 목록 (관리자용, 탈퇴 포함, 마지막 로그인 시각 포함) */
  async findManyUsers({
    skip,
    limit,
    order,
  }: PaginationDto): Promise<PaginationResult<UserWithLastLogin>> {
    const [total, items] = await Promise.all([
      this.prismaService.user.count(),
      this.prismaService.user.findMany({
        include: userWithLastLoginIncludeOptions,
        skip,
        take: limit,
        orderBy: { createdAt: order },
      }),
    ]);
    return { total, items };
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

  /**
   * 유저 탈퇴(소프트 딜리트). 한 트랜잭션에서
   *  1) deletedAt 설정 + email 마스킹(unique 해제 → 동일 이메일 재가입 허용)
   *  2) 인증(UserAuth) 삭제(provider·providerId unique 해제 → 재가입 시 충돌 방지)
   *  3) 리프레시 토큰 전체 무효화(모든 기기 세션 종료)
   *
   * 유저 정보 자체는 일정 기간 보관을 위해 남긴다.
   */
  async softDeleteUser(user: User): Promise<void> {
    // 원본 email 을 남기되 unique 를 풀기 위해 앞에 식별자를 붙이고 길이 상한(255)을 지킨다.
    const maskedEmail: string = `deleted-${user.id}-${user.email}`.slice(
      0,
      255,
    );
    await this.prismaService.$transaction([
      this.prismaService.user.update({
        where: { id: user.id },
        data: { deletedAt: new Date(), email: maskedEmail },
      }),
      this.prismaService.userAuth.deleteMany({ where: { userId: user.id } }),
      this.prismaService.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
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
