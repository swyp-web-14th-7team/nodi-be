import { Module } from '@nestjs/common';
import { OauthGoogleService } from '@/lib/oauth/oauth-google.service';
import { OauthNaverService } from '@/lib/oauth/oauth-naver.service';
import { OauthResolver } from '@/lib/oauth/oauth-resolver.service';

@Module({
  providers: [OauthGoogleService, OauthNaverService, OauthResolver],
  exports: [OauthResolver],
})
export class OauthModule {}
