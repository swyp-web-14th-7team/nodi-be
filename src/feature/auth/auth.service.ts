import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/feature/users/users.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from '@/lib/redis/redis.service';
import { Provider } from '@/common/enum/provider.enum';
import { OauthGoogleService } from '@/lib/oauth/oauth-google.service';
import { type LoginDto } from '@/feature/auth/dto/login.dto';
import { User } from '@/prisma/client';
import { LoginResponse } from '@/feature/auth/type/login-response.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly oauthGoogleService: OauthGoogleService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async getGoogleAuthUrl(): Promise<string> {
    const state = randomUUID();
    await this.redisService.set(`oauth:${state}`, Provider.GOOGLE);
    return this.oauthGoogleService.getAuthUrl(state);
  }

  private async generateToken() {}

  async login({ state, provider, code }: LoginDto): Promise<LoginResponse> {
    const cachedProvider: string | null = await this.redisService.get(
      `oauth:${state}`,
    );
    if (!cachedProvider || cachedProvider !== provider)
      throw new UnauthorizedException('유효하지 않거나 만료된 요청입니다.');

    const payload = await this.oauthGoogleService.exchangeCode(code);
    const { sub, email, email_verified, name } = payload ?? {};
    if (!payload || !sub || !email || !email_verified || !name)
      throw new UnauthorizedException('유저 정보 불러오기가 실패하였습니다.');

    const user: User = await this.usersService.login({
      email,
      provider,
      providerId: sub,
      name,
    });
    // TODO: JWT 토큰 생성 및 발급

    return { accessToken: '' };
  }
}
