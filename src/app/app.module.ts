import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/module/auth/auth.module';
import { UsersModule } from '@/module/users/users.module';
import { LoggerModule } from '@/lib/logger/logger.module';
import 'dotenv/config';
import { PrismaModule } from '@/lib/prisma/prisma.module';
import { ProfileCardsModule } from '@/module/profile-cards/profile-cards.module';
import { SkillsModule } from '@/module/skills/skills.module';
import { SkillCategoriesModule } from '@/module/skill-categories/skill-categories.module';
import { InterestsModule } from '@/module/interests/interests.module';
import { FilesModule } from '@/module/files/files.module';
import { JobTypeModule } from '@/module/job-type/job-type.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    AuthModule,
    UsersModule,
    ProfileCardsModule,
    SkillsModule,
    SkillCategoriesModule,
    InterestsModule,
    FilesModule,
    JobTypeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
