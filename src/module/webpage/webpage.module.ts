import { Module } from '@nestjs/common';
import { WebpageController } from '@/module/webpage/webpage.controller';

@Module({
  controllers: [WebpageController],
})
export class WebpageModule {}
