import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from '@/module/auth/auth.controller';
import { UsersModule } from '@/module/users/users.module';
import { RedisModule } from '@/lib/redis/redis.module';
import { OauthModule } from '@/lib/oauth/oauth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule,
    RedisModule,
    OauthModule,
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
