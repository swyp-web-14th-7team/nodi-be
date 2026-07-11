import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/module/users/users.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from '@/lib/redis/redis.service';
import { Provider } from '@/common/enum/provider.enum';
import { OauthResolver } from '@/lib/oauth/oauth-resolver.service';
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
    private readonly oauthResolver: OauthResolver,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    configService: ConfigService,
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
  ) {
    this.SECRET_KEY = configService.getOrThrow('JWT_SECRET');
    this.REFRESH_SECRET_KEY = configService.getOrThrow('JWT_REFRESH_SECRET');
  }

  async getAuthUrl(provider: Provider, origin: string): Promise<string> {
    const state = randomUUID();
    await this.redisService.set(
      `oauth:${state}`,
      JSON.stringify({ provider, origin }),
    );
    return this.oauthResolver.get(provider).getAuthUrl(state, origin);
  }

  private async generateToken(
    userId: string,
    role: number,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // role 은 access token 의 앞단 컷에만 쓰인다.
    // refresh 는 /auth/refresh 에서 DB 로 role 을 재조회하므로 role claim 불필요.
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, role } satisfies JwtPayload, {
        expiresIn: JwtAccessTokenExpires,
        secret: this.SECRET_KEY,
      }),
      this.jwtService.signAsync({ sub: userId } satisfies JwtPayload, {
        expiresIn: JwtRefreshTokenExpires,
        secret: this.REFRESH_SECRET_KEY,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async verifyTokenAsync(token: string, type: 'accessToken' | 'refreshToken') {
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync<JwtPayload>(
        token,
        {
          secret:
            type === 'accessToken' ? this.SECRET_KEY : this.REFRESH_SECRET_KEY,
        },
      );
      return payload;
    } catch {
      throw new UnauthorizedException(`유효하지 않은 ${type} 입니다.`);
    }
  }

  private hashToken = (t: string) =>
    createHash('sha256').update(t).digest('hex');

  async login(
    deviceId: string,
    { state, provider, code }: LoginDto,
  ): Promise<LoginResponse & { refreshToken: string }> {
    const raw: string | null = await this.redisService.get(`oauth:${state}`);
    if (!raw)
      throw new UnauthorizedException('유효하지 않거나 만료된 요청입니다.');

    const { provider: cachedProvider, origin } = JSON.parse(raw) as {
      provider: string;
      origin: string;
    };
    if (cachedProvider !== provider)
      throw new UnauthorizedException('유효하지 않거나 만료된 요청입니다.');

    const profile = await this.oauthResolver
      .get(provider as Provider)
      .getProfile(code, origin, state);

    const user: User = await this.usersService.login({
      email: profile.email,
      provider,
      providerId: profile.providerId,
      name: profile.name,
    });

    const { accessToken, refreshToken } = await this.generateToken(
      user.id,
      user.role,
    );
    const hashedToken = this.hashToken(refreshToken);
    await this.prismaService.refreshToken.upsert({
      where: { userId_deviceId: { deviceId, userId: user.id } },
      update: { token: hashedToken, revokedAt: null },
      create: { deviceId, token: hashedToken, userId: user.id },
    });

    // 로그인 성공 → state 일회용 소비(재사용/replay 방지)
    await this.redisService.del(`oauth:${state}`);

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }

  async refresh(
    deviceId: string,
    token: string,
  ): Promise<LoginResponse & { refreshToken: string }> {
    const oldTokenPayload = await this.verifyTokenAsync(token, 'refreshToken');

    const hashedOldToken = this.hashToken(token);
    const oldToken: { user: User } | null =
      await this.prismaService.refreshToken.findUnique({
        where: {
          deviceId_token: { deviceId, token: hashedOldToken },
          revokedAt: null,
        },
        select: {
          user: true,
        },
      });
    if (!oldToken || oldToken.user.id !== oldTokenPayload.sub)
      throw new UnauthorizedException('유효하지 않은 refresh 토큰입니다.');

    // refresh 시 DB 의 현재 role 을 다시 굽는다 → 강등/승격이 다음 토큰에 반영됨
    const { accessToken, refreshToken } = await this.generateToken(
      oldToken.user.id,
      oldToken.user.role,
    );
    const hashedToken = this.hashToken(refreshToken);
    await this.prismaService.refreshToken.update({
      where: { userId_deviceId: { deviceId, userId: oldToken.user.id } },
      data: { token: hashedToken },
    });
    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }

  async logout(deviceId: string, token: string): Promise<void> {
    const jwtPayload = await this.verifyTokenAsync(token, 'refreshToken');
    const hashedToken = this.hashToken(token);

    const user: User | null = await this.prismaService.user.findUnique({
      where: { id: jwtPayload.sub },
    });
    if (!user)
      throw new UnauthorizedException('유효하지 않은 refresh 토큰입니다.');

    await this.prismaService.refreshToken.updateMany({
      where: {
        deviceId,
        token: hashedToken,
        userId: user.id,
      },
      data: { revokedAt: new Date() },
    });
  }
}
