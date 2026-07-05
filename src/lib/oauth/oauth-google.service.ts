import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import {
  OauthProfile,
  OauthProvider,
} from '@/lib/oauth/oauth-provider.interface';

@Injectable()
export class OauthGoogleService implements OauthProvider {
  private readonly client: OAuth2Client;
  private readonly redirectPath: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new OAuth2Client({
      clientId: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.getOrThrow<string>(
        'GOOGLE_CLIENT_SECRET',
      ),
    });
    this.redirectPath = this.configService.getOrThrow<string>(
      'GOOGLE_REDIRECT_PATH',
    );
  }

  getAuthUrl(state: string, origin: string): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state,
      redirect_uri: `${origin}${this.redirectPath}`,
    });
  }

  async getProfile(code: string, origin: string): Promise<OauthProfile> {
    let payload: TokenPayload | undefined;
    try {
      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: `${origin}${this.redirectPath}`,
      });
      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const oauthError = e.response?.data?.error as string | undefined;

      if (oauthError === 'invalid_grant') {
        throw new UnauthorizedException('유효하지 않거나 만료된 요청입니다.');
      }
      throw new InternalServerErrorException(
        '로그인 처리 중 오류가 발생했습니다.',
      );
    }

    // 검증은 try 밖에서 → UnauthorizedException 이 위 catch 에 삼켜지지 않도록
    const { sub, email, email_verified, name } = payload ?? {};
    if (!payload || !sub || !email || !email_verified || !name)
      throw new UnauthorizedException('유저 정보 불러오기가 실패하였습니다.');

    return { providerId: sub, email, name };
  }
}
