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

interface KakaoTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface KakaoProfileResponse {
  id?: number;
  kakao_account?: {
    email?: string;
    profile?: { nickname?: string };
  };
  properties?: { nickname?: string };
}

@Injectable()
export class OauthKakaoService implements OauthProvider {
  private readonly clientId: string;
  private readonly clientSecret?: string; // 카카오는 client_secret 이 선택(콘솔에서 활성화 시에만)
  private readonly redirectPath: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.getOrThrow<string>('KAKAO_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('KAKAO_CLIENT_SECRET');
    this.redirectPath = this.configService.getOrThrow<string>(
      'KAKAO_REDIRECT_PATH',
    );
  }

  getAuthUrl(state: string, origin: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: `${origin}${this.redirectPath}`,
      state,
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  async getProfile(code: string, origin: string): Promise<OauthProfile> {
    const accessToken = await this.fetchAccessToken(code, origin);
    const profile = await this.fetchProfile(accessToken);

    const email = profile.kakao_account?.email;
    const name =
      profile.kakao_account?.profile?.nickname ?? profile.properties?.nickname;
    console.log(profile);
    if (!profile.id || !email || !name)
      throw new UnauthorizedException('유저 정보 불러오기가 실패하였습니다.');

    return { providerId: String(profile.id), email, name };
  }

  /** 인가 code → access_token (카카오는 POST form + redirect_uri 필요) */
  private async fetchAccessToken(
    code: string,
    origin: string,
  ): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      redirect_uri: `${origin}${this.redirectPath}`,
      code,
    });
    if (this.clientSecret) body.set('client_secret', this.clientSecret);

    let data: KakaoTokenResponse;
    try {
      const res = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      data = (await res.json()) as KakaoTokenResponse;
    } catch {
      throw new InternalServerErrorException(
        '로그인 처리 중 오류가 발생했습니다.',
      );
    }

    if (data.error || !data.access_token)
      throw new UnauthorizedException('유효하지 않거나 만료된 요청입니다.');

    return data.access_token;
  }

  /** access_token → 유저 프로필 */
  private async fetchProfile(
    accessToken: string,
  ): Promise<KakaoProfileResponse> {
    let data: KakaoProfileResponse;
    try {
      const res = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      data = (await res.json()) as KakaoProfileResponse;
    } catch {
      throw new InternalServerErrorException(
        '로그인 처리 중 오류가 발생했습니다.',
      );
    }

    if (!data.id)
      throw new UnauthorizedException('유저 정보 불러오기가 실패하였습니다.');

    return data;
  }
}
