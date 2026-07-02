import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/module/users/users.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from '@/lib/redis/redis.service';
import { Provider } from '@/common/enum/provider.enum';
import { OauthGoogleService } from '@/lib/oauth/oauth-google.service';
import { type LoginDto } from '@/module/auth/dto/login.dto';
import { User } from '@/prisma/client';
import { LoginResponse } from '@/module/auth/type/login-response.type';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@/module/auth/type/jwt-payload.type';
import { createHash } from 'crypto';
import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  JwtAccessTokenExpires,
  JwtRefreshTokenExpires,
} from '@/common/constant/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  private readonly SECRET_KEY: string;
  private readonly REFRESH_SECRET_KEY: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly oauthGoogleService: OauthGoogleService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    configService: ConfigService,
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
  ) {
    this.SECRET_KEY = configService.getOrThrow('JWT_SECRET');
    this.REFRESH_SECRET_KEY = configService.getOrThrow('JWT_REFRESH_SECRET');
  }

  async getGoogleAuthUrl(): Promise<string> {
    const state = randomUUID();
    await this.redisService.set(`oauth:${state}`, Provider.GOOGLE);
    return this.oauthGoogleService.getAuthUrl(state);
  }

  private async generateToken(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: JwtAccessTokenExpires,
        secret: this.SECRET_KEY,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: JwtRefreshTokenExpires,
        secret: this.REFRESH_SECRET_KEY,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async verifyTokenAsync(token: string, type: 'accessToken' | 'refreshToken') {
    try {
      return this.jwtService.verifyAsync<JwtPayload>(token, {
        secret:
          type === 'accessToken' ? this.SECRET_KEY : this.REFRESH_SECRET_KEY,
      });
    } catch {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다.');
    }
  }

  private hashToken = (t: string) =>
    createHash('sha256').update(t).digest('hex');

  async login(
    deviceId: string,
    { state, provider, code }: LoginDto,
  ): Promise<LoginResponse & { refreshToken: string }> {
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

    const { accessToken, refreshToken } = await this.generateToken(user.id);
    const hashedToken = this.hashToken(refreshToken);
    await this.prismaService.refreshToken.upsert({
      where: { userId_deviceId: { deviceId, userId: user.id } },
      update: { token: hashedToken },
      create: { deviceId, token: hashedToken, userId: user.id },
    });
    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }
}
