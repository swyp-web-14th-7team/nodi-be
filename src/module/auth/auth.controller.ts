import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from '@/module/auth/auth.service';
import type { CookieOptions, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '@/module/auth/dto/login.dto';
import { LoginResponse } from '@/module/auth/type/login-response.type';
import { JwtRefreshTokenExpiresMs } from '@/common/constant/jwt';
import { GetOauthResponse } from '@/module/auth/type/get-oauth-response.type';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const DEVICE_ID_COOKIE_KEY: string = 'device_id';
const DEVICE_ID_MAX_AGE_MS: number = 400 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_KEY: string = 'refresh_token';

@ApiInternalServerErrorResponse()
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

  /**
   * 구글 소셜로그인 Url
   * @remarks
   * 소셜 로그인용 Url 을 요청합니다. deviceId 가 없다면 uuid 형식으로 세팅합니다.
   * @param req
   * @param res
   */
  @Get('google')
  @ApiResponseSuccess(GetOauthResponse)
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

  /**
   * 회원가입 및 로그인
   * @remarks
   * 쿠키에 deviceId 를 uuid 형식으로 가지고 있어야 합니다.
   *
   * 이는 GET /auth/{provider} 요청 시 자동 설정되니 신경쓰지 않아도 됨.
   *
   * body 에 provider 는 .toUpperCase 해서 보내주세요! (대문자로) (GOOGLE, KAKAO, NAVER)
   * @param loginDto
   * @param req
   * @param res
   */
  @Post('login')
  @ApiResponseSuccess(LoginResponse)
  @ApiBadRequestResponse({ description: 'deviceId 가 필요합니다.' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const { deviceId } = this.extractCookies(req);
    if (!deviceId) throw new BadRequestException('deviceId 가 필요합니다.');

    const { accessToken, tokenType, refreshToken } =
      await this.authService.login(deviceId, loginDto);
    res.cookie(REFRESH_TOKEN_KEY, refreshToken, this.refreshTokenCookieOptions);
    return { accessToken, tokenType };
  }

  /**
   * 토큰 refresh
   * @remarks
   * 인증 토큰 (accessToken, refreshToken) 을 갱신합니다.
   *
   * **Request cookie 값**
   * - deviceId
   * - refreshToken
   *
   * 결과: deviceId, refreshToken, accessToken 갱신
   * @param req
   * @param res
   */
  @Post('refresh')
  @ApiResponseSuccess(LoginResponse)
  @ApiBadRequestResponse({ description: 'deviceId 가 필요합니다.' })
  @ApiBadRequestResponse({ description: 'refreshToken 이 필요합니다.' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 refresh 토큰입니다.' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const { deviceId, refreshToken: oldRefreshToken } =
      this.extractCookies(req);

    if (!deviceId) throw new BadRequestException('deviceId 가 필요합니다.');
    if (!oldRefreshToken)
      throw new BadRequestException('refreshToken 이 필요합니다.');

    const { accessToken, refreshToken, tokenType } =
      await this.authService.refresh(deviceId, oldRefreshToken);
    res.cookie(REFRESH_TOKEN_KEY, refreshToken, this.refreshTokenCookieOptions);
    res.cookie(DEVICE_ID_COOKIE_KEY, deviceId, this.deviceIdCookieOptions);
    return { accessToken, tokenType };
  }

  /**
   * 로그아웃
   * @remarks
   * 로그아웃 (인증 비활성화) 합니다.
   *
   * **Request cookie 값**
   * - deviceId
   * - refreshToken
   *
   * **결과**
   * - 쿠키에서 refreshToken 제거 및 DB 에서 비활성화
   * @param req
   * @param res
   */
  @Post('logout')
  @ApiResponseSuccess()
  @ApiBadRequestResponse({ description: 'deviceId 가 필요합니다.' })
  @ApiBadRequestResponse({ description: 'refreshToken 가 필요합니다.' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 refresh 토큰입니다.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { deviceId, refreshToken } = this.extractCookies(req);
    if (!deviceId) throw new BadRequestException('deviceId 가 필요합니다.');
    if (!refreshToken)
      throw new BadRequestException('refreshToken 이 필요합니다.');

    await this.authService.logout(deviceId, refreshToken);
    res.clearCookie(REFRESH_TOKEN_KEY, this.refreshTokenCookieOptions);
    return;
  }

  private extractCookies(req: Request) {
    const deviceId: string | undefined = req.cookies?.[DEVICE_ID_COOKIE_KEY] as
      | string
      | undefined;
    const refreshToken: string | undefined = req.cookies?.[
      REFRESH_TOKEN_KEY
    ] as string | undefined;
    return { deviceId, refreshToken };
  }
}
