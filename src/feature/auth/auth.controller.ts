import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from '@/feature/auth/auth.service';
import type { CookieOptions, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '@/feature/auth/dto/login.dto';
import { ResponseSuccess } from '@/common/type/response-success.type';
import { LoginResponse } from '@/feature/auth/type/login-response.type';
import { JwtRefreshTokenExpiresMs } from '@/common/constant/jwt';

const DEVICE_ID_COOKIE_KEY: string = 'device_id';
const DEVICE_ID_MAX_AGE_MS: number = 400 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_KEY: string = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private deviceIdCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none', // 프론트 != 백엔드 인 경우 none, 같은 경우 lax
    path: '/',
    maxAge: DEVICE_ID_MAX_AGE_MS,
  };

  private refreshTokenCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: JwtRefreshTokenExpiresMs,
  };

  @Get('google')
  async getGoogleLoginUrl(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId: string =
      (req.cookies?.[DEVICE_ID_COOKIE_KEY] as string | undefined) ??
      randomUUID();

    res.cookie(DEVICE_ID_COOKIE_KEY, deviceId, this.deviceIdCookieOptions);
    const url: string = await this.authService.getGoogleAuthUrl();
    return { url };
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const deviceId: string | undefined = req.cookies?.[DEVICE_ID_COOKIE_KEY] as
      | string
      | undefined;
    if (!deviceId) throw new BadRequestException('deviceId 가 필요합니다.');

    const { accessToken, tokenType, refreshToken } =
      await this.authService.login(deviceId, loginDto);
    res.cookie(REFRESH_TOKEN_KEY, refreshToken, this.refreshTokenCookieOptions);
    return { accessToken, tokenType };
  }
}
