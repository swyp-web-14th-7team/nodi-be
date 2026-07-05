import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OauthProfile,
  OauthProvider,
} from '@/lib/oauth/oauth-provider.interface';

interface NaverTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface NaverProfileResponse {
  resultcode: string;
  message: string;
  response?: {
    id: string;
    email?: string;
    name?: string;
  };
}

@Injectable()
export class OauthNaverService implements OauthProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectPath: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.getOrThrow<string>('NAVER_CLIENT_ID');
    this.clientSecret = this.configService.getOrThrow<string>(
      'NAVER_CLIENT_SECRET',
    );
    this.redirectPath = this.configService.getOrThrow<string>(
      'NAVER_REDIRECT_PATH',
    );
  }

  getAuthUrl(state: string, origin: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: `${origin}${this.redirectPath}`,
      state,
    });
    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  async getProfile(
    code: string,
    _origin: string,
    state: string,
  ): Promise<OauthProfile> {
    const accessToken = await this.fetchAccessToken(code, state);
    const profile = await this.fetchProfile(accessToken);

    if (!profile.id || !profile.email || !profile.name)
      throw new UnauthorizedException('유저 정보 불러오기가 실패하였습니다.');

    return {
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
    };
  }

  /** 인가 code → access_token (네이버는 토큰 교환에도 state 필요) */
  private async fetchAccessToken(code: string, state: string): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      state,
    });

    let body: NaverTokenResponse;
    try {
      const res = await fetch(
        `https://nid.naver.com/oauth2.0/token?${params.toString()}`,
      );
      body = (await res.json()) as NaverTokenResponse;
    } catch {
      throw new InternalServerErrorException(
        '로그인 처리 중 오류가 발생했습니다.',
      );
    }

    if (body.error || !body.access_token)
      throw new UnauthorizedException('유효하지 않거나 만료된 요청입니다.');

    return body.access_token;
  }

  /** access_token → 유저 프로필 */
  private async fetchProfile(accessToken: string) {
    let body: NaverProfileResponse;
    try {
      const res = await fetch('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      body = (await res.json()) as NaverProfileResponse;
    } catch {
      throw new InternalServerErrorException(
        '로그인 처리 중 오류가 발생했습니다.',
      );
    }

    // 네이버는 정상 응답 시 resultcode "00"
    if (body.resultcode !== '00' || !body.response)
      throw new UnauthorizedException('유저 정보 불러오기가 실패하였습니다.');

    return body.response;
  }
}
