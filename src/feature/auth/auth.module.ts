import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from '@/feature/auth/auth.controller';
import { PrismaModule } from '@/lib/prisma/prisma.module';
import { UsersModule } from '@/feature/users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
