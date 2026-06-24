import { Injectable } from '@nestjs/common';
import { UsersService } from '@/feature/users/users.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from '@/lib/redis/redis.service';
import { Provider } from '@/common/enum/provider.enum';
import { OauthGoogleService } from '@/lib/oauth/oauth-google.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly oauthGoogleService: OauthGoogleService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async getGoogleAuthUrl(): Promise<string> {
    const state = randomUUID();
    await this.redisService.set(`oauth:${state}`, Provider.GOOGLE);
    return this.oauthGoogleService.getAuthUrl(state);
  }
}
