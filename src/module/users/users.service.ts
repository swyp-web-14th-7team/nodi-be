import { Injectable } from '@nestjs/common';
import { type User } from '@/prisma/client';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@/common/enum/user-role.enum';
import { LoginParams } from '@/module/users/type/login-params.type';
import { Prisma } from '@/prisma/client';
import { UpdateProfileDto } from '@/module/users/dto/update-profile.dto';
import { UsersRepository } from '@/module/users/users.repository';
import { UserWithDefaultCard } from '@/module/users/users.type';

@Injectable()
export class UsersService {
  private readonly ADMIN_EMAIL: string;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {
    this.ADMIN_EMAIL = configService.getOrThrow<string>('ADMIN_EMAIL');
  }

  async findUnique(
    whereOptions: Prisma.UserWhereUniqueInput,
    withDefault: boolean = false,
  ): Promise<UserWithDefaultCard | User | null> {
    return withDefault
      ? this.usersRepository.findUniqueUserWithDefaultCard(whereOptions)
      : this.usersRepository.findUniqueUser(whereOptions);
  }

  async updateMyProfile(
    user: User,
    dto: UpdateProfileDto,
  ): Promise<UserWithDefaultCard> {
    return this.usersRepository.updateUser(user.id, dto);
  }

  private async signUp(params: LoginParams): Promise<User> {
    // 관리자 이메일과 일치하면 ADMIN 권한 부여
    const role: UserRole | undefined =
      this.ADMIN_EMAIL === params.email ? UserRole.ADMIN : undefined;
    return this.usersRepository.createUser({ ...params, role });
  }

  /**
   * 유저가 존재하지 않는다면 추가하여 반환, 동일한 유저 (email) 가 인증을 추가할 경우 인증 추가
   */
  async login({
    name,
    providerId,
    provider,
    email,
  }: LoginParams): Promise<User> {
    const byAuth: User | null = await this.usersRepository.findUniqueUserByAuth(
      {
        provider_providerId: { provider, providerId },
      },
    );
    if (byAuth) return byAuth;

    const byEmail: User | null = await this.findUnique({ email });
    if (byEmail) {
      // 같은 이메일 유저가 있으면 신규 가입 대신 새 provider 인증만 연결
      await this.usersRepository.createUserAuth({
        userId: byEmail.id,
        provider,
        providerId,
      });
      return byEmail;
    }

    return this.signUp({ name, email, provider, providerId });
  }
}
