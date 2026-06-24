import { Module } from '@nestjs/common';
import { OauthGoogleService } from '@/lib/oauth/oauth-google.service';

@Module({
  providers: [OauthGoogleService],
  exports: [OauthGoogleService],
})
export class OauthModule {}
