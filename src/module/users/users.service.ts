import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { type User } from '@/prisma/client';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@/common/enum/user-role.enum';
import { LoginParams } from '@/module/users/type/login-params.type';
import { Prisma } from '@/prisma/client';

@Injectable()
export class UsersService {
  private readonly ADMIN_EMAIL: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.ADMIN_EMAIL = configService.getOrThrow<string>('ADMIN_EMAIL');
  }

  async findUnique(
    whereOptions: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { ...whereOptions, deletedAt: null },
    });
  }

  private async findUniqueByAuth(
    whereOptions: Prisma.UserAuthWhereUniqueInput,
  ): Promise<User | null> {
    const data: { user: User } | null =
      await this.prismaService.userAuth.findUnique({
        where: { ...whereOptions, user: { deletedAt: null } },
        select: { user: true },
      });
    return data?.user ?? null;
  }

  private async signUp({
    name,
    providerId,
    email,
    provider,
  }: LoginParams): Promise<User> {
    return this.prismaService.user.create({
      data: {
        name,
        email,
        nickname: name,
        ...(this.ADMIN_EMAIL === email && { role: UserRole.ADMIN }),
        auths: { create: { providerId, provider } },
      },
    });
  }

  /**
   * 로그인 조회 전용. 신규 생성/인증 연결 없이 기존 유저만 반환합니다.
   * (provider 인증 → email 순으로 조회, 없으면 null)
   *
   * @param param0
   * @param param0.provider
   * @param param0.providerId
   * @param param0.email
   */
  async findByLogin({
    provider,
    providerId,
    email,
  }: Pick<
    LoginParams,
    'provider' | 'providerId' | 'email'
  >): Promise<User | null> {
    const byAuth: User | null = await this.findUniqueByAuth({
      provider_providerId: { provider, providerId },
    });
    if (byAuth) return byAuth;

    return this.findUnique({ email });
  }

  /**
   * 유저가 존재하지 않는다면 추가하여 반환, 동일한 유저 (email) 가 인증을 추가할 경우 인증 추가
   *
   * @param param0
   * @param param0.name
   * @param param0.providerId
   * @param param0.provider
   * @param param0.email
   */
  async login({
    name,
    providerId,
    provider,
    email,
  }: LoginParams): Promise<User> {
    const byAuth: User | null = await this.findUniqueByAuth({
      provider_providerId: { provider, providerId },
    });
    if (byAuth) return byAuth;

    const byEmail: User | null = await this.findUnique({ email });
    if (byEmail) {
      // 같은 이메일 유저가 있으면 신규 가입 대신 새 provider 인증만 연결
      await this.prismaService.userAuth.create({
        data: { userId: byEmail.id, provider, providerId },
      });
      return byEmail;
    }

    return this.signUp({ name, email, provider, providerId });
  }
}
