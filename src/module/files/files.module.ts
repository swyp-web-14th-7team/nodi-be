import { Module } from '@nestjs/common';
import { FilesController } from '@/module/files/files.controller';
import { FilesService } from '@/module/files/files.service';
import { S3Module } from '@/lib/s3/s3.module';
import { UsersModule } from '@/module/users/users.module';

@Module({
  imports: [S3Module, UsersModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
