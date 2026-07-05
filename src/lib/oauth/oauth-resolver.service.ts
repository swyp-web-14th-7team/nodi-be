import { BadRequestException, Injectable } from '@nestjs/common';
import { Provider } from '@/common/enum/provider.enum';
import { OauthProvider } from '@/lib/oauth/oauth-provider.interface';
import { OauthGoogleService } from '@/lib/oauth/oauth-google.service';
import { OauthNaverService } from '@/lib/oauth/oauth-naver.service';

/** provider 값에 맞는 OAuth 서비스 구현체를 반환 (분기 집중) */
@Injectable()
export class OauthResolver {
  constructor(
    private readonly googleService: OauthGoogleService,
    private readonly naverService: OauthNaverService,
  ) {}

  get(provider: Provider): OauthProvider {
    switch (provider) {
      case Provider.GOOGLE:
        return this.googleService;
      case Provider.NAVER:
        return this.naverService;
      default:
        throw new BadRequestException(`지원하지 않는 provider: ${provider}`);
    }
  }
}
