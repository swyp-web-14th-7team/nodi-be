import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@/lib/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/feature/auth/auth.module';
import { UsersModule } from '@/feature/users/users.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
