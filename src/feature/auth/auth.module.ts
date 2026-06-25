import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from '@/feature/auth/auth.controller';
import { PrismaModule } from '@/lib/prisma/prisma.module';
import { UsersModule } from '@/feature/users/users.module';
import { RedisModule } from '@/lib/redis/redis.module';
import { OauthModule } from '@/lib/oauth/oauth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    RedisModule,
    OauthModule,
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
