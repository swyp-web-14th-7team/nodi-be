import { Controller, Get, Req, Res } from '@nestjs/common';
import { AuthService } from '@/feature/auth/auth.service';
import type { CookieOptions, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

const DEVICE_ID_COOKIE_KEY: string = 'device_id';
const DEVICE_ID_MAX_AGE_MS: number = 400 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private deviceIdCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'prod',
      sameSite: 'none', // 프론트 != 백엔드 인 경우 none, 같은 경우 lax
      path: '/',
      maxAge: DEVICE_ID_MAX_AGE_MS,
    };
  }

  @Get('google')
  async getGoogleLoginUrl(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<{ url: string }> {
    const deviceId: string =
      (req.cookies?.[DEVICE_ID_COOKIE_KEY] as string) ?? randomUUID();

    res.cookie(DEVICE_ID_COOKIE_KEY, deviceId, this.deviceIdCookieOptions());
    const url: string = await this.authService.getGoogleAuthUrl();
    return { url };
  }
}
