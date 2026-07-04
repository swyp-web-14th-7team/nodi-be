import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/module/auth/auth.module';
import { UsersModule } from '@/module/users/users.module';
import { LoggerModule } from '@/lib/logger/logger.module';
import 'dotenv/config';
import { PrismaModule } from '@/lib/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
