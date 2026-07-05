import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OauthGoogleService {
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

  async exchangeCode(code: string, origin: string) {
    try {
      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: `${origin}${this.redirectPath}`,
      });
      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      });
      return ticket.getPayload();
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
  }
}
